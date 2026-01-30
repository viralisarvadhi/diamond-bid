import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../app/hooks'
import { API_BASE_URL } from '../../utils/constants'

interface User {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'USER'
    budget: number
    is_active: boolean
}

interface ActionState {
    userId: string | null
    loading: boolean
}

const AdminUsers: React.FC = () => {
    const { token, user: currentUser } = useAppSelector((state) => state.auth)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [actionState, setActionState] = useState<ActionState>({
        userId: null,
        loading: false,
    })
    const [confirmDialog, setConfirmDialog] = useState<{
        userId: string | null
        action: 'activate' | 'deactivate' | null
    }>({
        userId: null,
        action: null,
    })
    const [actionError, setActionError] = useState<string | null>(null)

    const fetchUsers = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            })

            if (!response.ok) {
                throw new Error('Unable to load users.')
            }

            const data = await response.json()
            const usersList = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []

            setUsers(usersList)
        } catch (err) {
            setError('Unable to load users.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [token])

    const handleToggleStatus = (userId: string, currentActive: boolean) => {
        setConfirmDialog({
            userId,
            action: currentActive ? 'deactivate' : 'activate',
        })
    }

    const confirmAction = async () => {
        const { userId, action } = confirmDialog

        if (!userId || !action) return

        try {
            setActionState({ userId, loading: true })
            setActionError(null)

            const endpoint =
                action === 'activate'
                    ? `${API_BASE_URL}/admin/users/${userId}/activate`
                    : `${API_BASE_URL}/admin/users/${userId}/deactivate`

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData?.message || `Failed to ${action} user.`)
            }

            // Update local state
            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u.id === userId
                        ? {
                            ...u,
                            is_active: action === 'activate',
                        }
                        : u
                )
            )

            setConfirmDialog({ userId: null, action: null })
        } catch (err) {
            setActionError((err as Error).message || `Failed to ${action} user.`)
        } finally {
            setActionState({ userId: null, loading: false })
        }
    }

    const cancelAction = () => {
        setConfirmDialog({ userId: null, action: null })
        setActionError(null)
    }

    if (loading) {
        return <p className="text-sm text-gray-600">Loading users...</p>
    }

    return (
        <div className="space-y-4">
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
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Budget</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => {
                            const isActioning = actionState.userId === user.id && actionState.loading

                            return (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                        ${user.budget.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                        >
                                            {user.is_active ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                                            disabled={isActioning}
                                            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isActioning ? 'Processing...' : user.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
                    <p className="text-sm text-gray-600">No users found.</p>
                </div>
            )}

            {confirmDialog.userId && confirmDialog.action && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg max-w-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            {confirmDialog.action === 'activate'
                                ? 'This user will be able to place and edit bids.'
                                : 'This user will not be able to place or edit bids.'}
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
                                className={`rounded-md px-3 py-2 text-sm font-semibold text-white ${confirmDialog.action === 'deactivate'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                {actionState.loading ? 'Processing...' : confirmDialog.action === 'activate' ? 'Activate' : 'Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminUsers
