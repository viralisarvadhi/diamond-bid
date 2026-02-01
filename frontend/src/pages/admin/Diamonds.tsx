import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { API_BASE_URL } from '../../utils/constants'

interface Diamond {
    id: string
    diamond_name: string
    base_price: number
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'SOLD'
    start_time?: string
    end_time?: string
    bid_start_time?: string
    bid_end_time?: string
}

interface ActionState {
    diamondId: string | null
    action: 'activate' | 'close' | 'delete' | 'reschedule' | null
    loading: boolean
}

const formatDateTime = (value?: string) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString()
}

const formatDateTimeForInput = (value?: string) => {
    if (!value) return ''
    try {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return ''
        // Format: YYYY-MM-DDTHH:mm (required for datetime-local input)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch {
        return ''
    }
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'DRAFT':
            return 'bg-gray-100 text-gray-800'
        case 'ACTIVE':
            return 'bg-green-100 text-green-800'
        case 'CLOSED':
            return 'bg-yellow-100 text-yellow-800'
        case 'SOLD':
            return 'bg-purple-100 text-purple-800'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

const AdminDiamonds: React.FC = () => {
    const navigate = useNavigate()
    const { token } = useAppSelector((state) => state.auth)
    const [diamonds, setDiamonds] = useState<Diamond[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [actionState, setActionState] = useState<ActionState>({
        diamondId: null,
        action: null,
        loading: false,
    })
    const [confirmDialog, setConfirmDialog] = useState<{
        diamondId: string | null
        action: 'activate' | 'close' | 'delete' | 'reschedule' | null
    }>({
        diamondId: null,
        action: null,
    })
    const [actionError, setActionError] = useState<string | null>(null)
    const [editingDiamond, setEditingDiamond] = useState<{ name: string; basePrice: string; startTime?: string; endTime?: string } | null>(null)
    const [editingDiamondId, setEditingDiamondId] = useState<string | null>(null)

    const fetchDiamonds = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE_URL}/admin/diamonds`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            })

            if (!response.ok) {
                throw new Error('Unable to load diamonds.')
            }

            const data = await response.json()
            const diamondsList = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : []

            setDiamonds(diamondsList)
        } catch (err) {
            setError('Unable to load diamonds.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDiamonds()

        const interval = setInterval(() => {
            fetchDiamonds()
        }, 30000)

        return () => clearInterval(interval)
    }, [token])

    const handleAction = (diamondId: string, action: 'activate' | 'close' | 'delete' | 'reschedule') => {
        if (action === 'reschedule') {
            // Open reschedule dialog
            const diamond = diamonds.find(d => d.id === diamondId)
            if (diamond) {
                setEditingDiamondId(diamondId)
                setEditingDiamond({
                    name: diamond.diamond_name,
                    basePrice: diamond.base_price.toString(),
                    startTime: diamond.start_time || diamond.bid_start_time || '',
                    endTime: diamond.end_time || diamond.bid_end_time || '',
                })
            }
        } else {
            setConfirmDialog({
                diamondId,
                action,
            })
        }
    }

    const confirmAction = async () => {
        const { diamondId, action } = confirmDialog

        if (!diamondId || !action) return

        try {
            setActionState({ diamondId, action, loading: true })
            setActionError(null)

            if (action === 'delete') {
                const response = await fetch(`${API_BASE_URL}/admin/diamonds/${diamondId}`, {
                    method: 'DELETE',
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData?.message || 'Failed to delete diamond.')
                }

                // Remove from local state immediately
                setDiamonds((prevDiamonds) => prevDiamonds.filter((d) => d.id !== diamondId))

                // Also refetch to ensure sync with database
                setTimeout(() => fetchDiamonds(), 500)
            } else {
                const endpoint = `${API_BASE_URL}/admin/diamonds/${diamondId}/${action}`

                const response = await fetch(endpoint, {
                    method: 'PATCH',
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData?.message || `Failed to ${action} diamond.`)
                }

                const result = await response.json()

                // Check for suggestions when closing a bid
                if (action === 'close' && result.suggestions?.hasUpcomingDiamonds) {
                    const suggestion = result.suggestions
                    const nextDiamond = suggestion.nextDiamond

                    // Show alert with suggestion
                    const userConfirmed = window.confirm(
                        `✅ Bid closed successfully!\n\n` +
                        `💡 Suggestion: You have ${suggestion.count} upcoming DRAFT diamond(s).\n\n` +
                        `The next diamond "${nextDiamond.name}" is scheduled to start at:\n` +
                        `${new Date(nextDiamond.scheduledStart).toLocaleString()}\n\n` +
                        `Would you like to reschedule it to start earlier?\n\n` +
                        `Click OK to reschedule, or Cancel to keep the current schedule.`
                    )

                    if (userConfirmed) {
                        // Open reschedule dialog for the next diamond
                        const diamond = diamonds.find(d => d.id === nextDiamond.id)
                        if (diamond) {
                            setEditingDiamondId(nextDiamond.id)
                            setEditingDiamond({
                                name: nextDiamond.name,
                                basePrice: diamond.base_price.toString(),
                                startTime: nextDiamond.scheduledStart,
                                endTime: nextDiamond.scheduledEnd,
                            })
                        }
                    }
                }

                // Update local state
                setDiamonds((prevDiamonds) =>
                    prevDiamonds.map((d) => {
                        if (d.id === diamondId) {
                            if (action === 'activate') {
                                return { ...d, status: 'ACTIVE' }
                            }
                            if (action === 'close') {
                                return { ...d, status: 'CLOSED' }
                            }
                        }
                        return d
                    })
                )
            }

            setConfirmDialog({ diamondId: null, action: null })
        } catch (err) {
            setActionError((err as Error).message || `Failed to ${action} diamond.`)
        } finally {
            setActionState({ diamondId: null, action: null, loading: false })
        }
    }

    const handleEditSave = async (diamondId: string, isReschedule = false) => {
        if (!editingDiamond) return

        try {
            setActionState({ diamondId, action: 'activate', loading: true })
            setActionError(null)

            const endpoint = isReschedule
                ? `${API_BASE_URL}/admin/diamonds/${diamondId}/reschedule`
                : `${API_BASE_URL}/admin/diamonds/${diamondId}/edit`

            const body: any = {
                diamond_name: editingDiamond.name,
                base_price: parseFloat(editingDiamond.basePrice),
            }

            if (isReschedule && editingDiamond.startTime && editingDiamond.endTime) {
                // Convert datetime-local format to ISO string
                body.bid_start_time = new Date(editingDiamond.startTime).toISOString()
                body.bid_end_time = new Date(editingDiamond.endTime).toISOString()
            }

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(body),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData?.message || 'Failed to update diamond.')
            }

            const result = await response.json()
            const updatedDiamond = result.data || result.diamond

            // Update local state
            setDiamonds((prevDiamonds) =>
                prevDiamonds.map((d) => {
                    if (d.id === diamondId) {
                        return {
                            ...d,
                            diamond_name: editingDiamond.name,
                            base_price: parseFloat(editingDiamond.basePrice),
                            ...(isReschedule && {
                                start_time: editingDiamond.startTime,
                                end_time: editingDiamond.endTime,
                                status: 'DRAFT',
                            }),
                        }
                    }
                    return d
                })
            )

            setEditingDiamondId(null)
            setEditingDiamond(null)
        } catch (err) {
            setActionError((err as Error).message || 'Failed to update diamond.')
        } finally {
            setActionState({ diamondId: null, action: null, loading: false })
        }
    }

    const cancelAction = () => {
        setConfirmDialog({ diamondId: null, action: null })
        setActionError(null)
    }

    if (loading) {
        return <p className="text-sm text-gray-600">Loading diamonds...</p>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Diamonds</h2>
                <button
                    type="button"
                    onClick={() => navigate('/admin/diamonds/create')}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    + Create Diamond
                </button>
            </div>

            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                ℹ️ <strong>Auto-scheduling:</strong> Diamonds automatically activate at start time and close at end time. CLOSED diamonds can be rescheduled or deleted. ACTIVE diamonds cannot be edited/deleted.
            </div>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Base Price</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bid Start</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bid End</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                            <th className="sticky right-0 z-10 bg-gray-50 px-6 py-3 text-center text-sm font-semibold text-gray-900">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {diamonds.map((diamond) => {
                            const isActioning =
                                actionState.diamondId === diamond.id && actionState.loading

                            return (
                                <tr key={diamond.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {diamond.diamond_name}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                        ${diamond.base_price.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {formatDateTime(diamond.start_time || diamond.bid_start_time)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {formatDateTime(diamond.end_time || diamond.bid_end_time)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                                                diamond.status
                                            )}`}
                                        >
                                            {diamond.status}
                                        </span>
                                    </td>
                                    <td className="sticky right-0 z-10 bg-white px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                            {diamond.status === 'DRAFT' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingDiamondId(diamond.id)
                                                            setEditingDiamond({
                                                                name: diamond.diamond_name,
                                                                basePrice: diamond.base_price.toString(),
                                                            })
                                                        }}
                                                        disabled={isActioning}
                                                        className="rounded-md border border-purple-300 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(diamond.id, 'reschedule')}
                                                        disabled={isActioning}
                                                        className="rounded-md border border-green-300 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        🔄 Reschedule
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(diamond.id, 'delete')}
                                                        disabled={isActioning}
                                                        className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </>
                                            )}
                                            {diamond.status === 'ACTIVE' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(diamond.id, 'close')}
                                                        disabled={isActioning}
                                                        className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isActioning ? 'Processing...' : 'Close Bid'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/admin/bids/${diamond.id}`, { state: { from: 'diamonds' } })}
                                                        className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                    >
                                                        View Bids
                                                    </button>
                                                </>
                                            )}
                                            {diamond.status === 'CLOSED' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingDiamondId(diamond.id)
                                                            setEditingDiamond({
                                                                name: diamond.diamond_name,
                                                                basePrice: diamond.base_price.toString(),
                                                            })
                                                        }}
                                                        disabled={isActioning}
                                                        className="rounded-md border border-purple-300 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(diamond.id, 'reschedule')}
                                                        disabled={isActioning}
                                                        className="rounded-md border border-green-300 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        🔄 Reschedule
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAction(diamond.id, 'delete')}
                                                        disabled={isActioning}
                                                        className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/admin/bids/${diamond.id}`, { state: { from: 'diamonds' } })}
                                                        className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                    >
                                                        View Bids
                                                    </button>
                                                </>
                                            )}
                                            {diamond.status === 'SOLD' && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/admin/bids/${diamond.id}`, { state: { from: 'diamonds' } })}
                                                    className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                                >
                                                    View Bids
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {diamonds.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
                    <p className="text-sm text-gray-600">No diamonds yet.</p>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/diamonds/create')}
                        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Create the first diamond
                    </button>
                </div>
            )}

            {confirmDialog.diamondId && confirmDialog.action && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg max-w-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            {confirmDialog.action === 'close'
                                ? 'Manually close this bid now? This will prevent users from placing new bids. (Note: It will auto-close at the scheduled end time if you don\'t close it manually.)'
                                : 'This action cannot be undone. All associated data will be deleted.'}
                        </p>

                        {actionError && (
                            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                {actionError}
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={cancelAction}
                                disabled={actionState.loading}
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmAction}
                                disabled={actionState.loading}
                                className={`rounded-md px-3 py-2 text-sm font-semibold text-white ${confirmDialog.action === 'close'
                                    ? 'bg-yellow-600 hover:bg-yellow-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                {actionState.loading
                                    ? 'Processing...'
                                    : confirmDialog.action === 'activate'
                                        ? 'Activate'
                                        : confirmDialog.action === 'delete'
                                            ? 'Delete'
                                            : 'Close Bid'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingDiamondId && editingDiamond && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {editingDiamond.startTime ? 'Reschedule Diamond' : 'Edit Diamond'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            {editingDiamond.startTime
                                ? 'Update times and the diamond will remain in DRAFT status until auto-activation'
                                : 'Edit name and price for DRAFT or CLOSED diamonds'}
                        </p>

                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Diamond Name
                                </label>
                                <input
                                    type="text"
                                    value={editingDiamond.name}
                                    onChange={(e) =>
                                        setEditingDiamond({ ...editingDiamond, name: e.target.value })
                                    }
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Base Price ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editingDiamond.basePrice}
                                    onChange={(e) =>
                                        setEditingDiamond({ ...editingDiamond, basePrice: e.target.value })
                                    }
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            {editingDiamond.startTime !== undefined && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Bid Start Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formatDateTimeForInput(editingDiamond.startTime)}
                                            onChange={(e) =>
                                                setEditingDiamond({ ...editingDiamond, startTime: e.target.value })
                                            }
                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Bid End Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formatDateTimeForInput(editingDiamond.endTime)}
                                            onChange={(e) =>
                                                setEditingDiamond({ ...editingDiamond, endTime: e.target.value })
                                            }
                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {actionError && (
                            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                {actionError}
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingDiamondId(null)
                                    setEditingDiamond(null)
                                    setActionError(null)
                                }}
                                disabled={actionState.loading}
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleEditSave(editingDiamondId, editingDiamond.startTime !== undefined)}
                                disabled={
                                    actionState.loading ||
                                    !editingDiamond.name ||
                                    !editingDiamond.basePrice ||
                                    (editingDiamond.startTime !== undefined && (!editingDiamond.startTime || !editingDiamond.endTime))
                                }
                                className="rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {actionState.loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminDiamonds
