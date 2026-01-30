import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import { API_BASE_URL } from '../../utils/constants'
import { useBidSocket } from '../../hooks/useBidSocket'

interface Bid {
    id: string
    user_id: string
    user_name: string
    bid_amount: number
    updated_at: string
}

interface Winner {
    id: string
    name: string
    email: string
    winning_amount: number
}

interface Diamond {
    id: string
    diamond_name: string
    base_price: number
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'SOLD'
    bid_end_time?: string
}

interface BidMonitoringData {
    diamond: Diamond
    bids: Bid[]
    highest_bid_user_id?: string
    winner?: Winner | null
}

interface ConfirmState {
    show: boolean
    loading: boolean
    error: string | null
}

const formatDateTime = (value?: string) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString()
}

const BidMonitoring: React.FC = () => {
    const { diamondId } = useParams<{ diamondId: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { token } = useAppSelector((state) => state.auth)

    const sourceFrom = (location.state as any)?.from || 'diamonds'

    const [data, setData] = useState<BidMonitoringData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [liveUsers, setLiveUsers] = useState<number>(0)
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        show: false,
        loading: false,
        error: null,
    })

    // =====================================
    // REAL-TIME BID UPDATES VIA SOCKET
    // =====================================
    const { isConnected } = useBidSocket({
        diamondId,
        onBidPlaced: (bidData) => {
            console.log('🟢 Bid placed received:', bidData)
            setData((prevData) => {
                if (!prevData) return prevData

                const existingBidIndex = prevData.bids.findIndex((b) => b.user_id === bidData.user_id)

                if (existingBidIndex > -1) {
                    // Update existing bid
                    const updatedBids = [...prevData.bids]
                    updatedBids[existingBidIndex] = {
                        id: bidData.bid_id,
                        user_id: bidData.user_id,
                        user_name: bidData.user_name,
                        bid_amount: bidData.bid_amount,
                        updated_at: bidData.created_at || new Date().toISOString(),
                    }
                    return { ...prevData, bids: updatedBids }
                } else {
                    // Add new bid
                    const newBid: Bid = {
                        id: bidData.bid_id,
                        user_id: bidData.user_id,
                        user_name: bidData.user_name,
                        bid_amount: bidData.bid_amount,
                        updated_at: bidData.created_at || new Date().toISOString(),
                    }
                    // Sort bids by amount (highest first)
                    const updatedBids = [...prevData.bids, newBid].sort((a, b) => b.bid_amount - a.bid_amount)
                    return { ...prevData, bids: updatedBids, highest_bid_user_id: updatedBids[0]?.user_id }
                }
            })
        },
        onBidUpdated: (bidData) => {
            console.log('🟡 Bid updated received:', bidData)
            setData((prevData) => {
                if (!prevData) return prevData

                const updatedBids = prevData.bids.map((bid) => {
                    if (bid.user_id === bidData.user_id) {
                        return {
                            ...bid,
                            bid_amount: bidData.new_amount,
                            updated_at: bidData.updated_at || new Date().toISOString(),
                        }
                    }
                    return bid
                })

                // Re-sort bids by amount (highest first)
                updatedBids.sort((a, b) => b.bid_amount - a.bid_amount)

                return { ...prevData, bids: updatedBids, highest_bid_user_id: updatedBids[0]?.user_id }
            })
        },
        onActiveUsersUpdate: (data) => {
            console.log('👥 Active users update:', data)
            if (data.diamondId === diamondId) {
                setLiveUsers(data.count)
            }
        },
    })

    const fetchBids = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE_URL}/admin/bids/${diamondId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            })

            if (!response.ok) {
                throw new Error('Unable to load bid data.')
            }

            const result = await response.json()
            const payload = result?.data ?? result

            if (!payload?.diamond) {
                throw new Error('Bid data missing')
            }

            const normalized: BidMonitoringData = {
                diamond: {
                    id: payload.diamond.id,
                    diamond_name: payload.diamond.diamond_name ?? payload.diamond.name ?? 'Diamond',
                    base_price: Number(payload.diamond.base_price),
                    status: payload.diamond.status,
                    bid_end_time: payload.diamond.bid_end_time ?? payload.diamond.end_time,
                },
                bids: Array.isArray(payload.bids)
                    ? payload.bids.map((bid: any) => ({
                        id: bid.id ?? bid.bid_id,
                        user_id: bid.user_id ?? bid.user?.id ?? '',
                        user_name: bid.user_name ?? bid.user?.name ?? 'User',
                        bid_amount: Number(bid.bid_amount ?? 0),
                        updated_at: bid.updated_at ?? bid.created_at ?? '',
                    }))
                    : [],
                highest_bid_user_id: payload.highest_bid_user_id ?? payload.stats?.highest_bid_user_id,
                winner: payload.winner ?? null,
            }

            setData(normalized)
            // Reset live users if not ACTIVE
            if (normalized.diamond.status !== 'ACTIVE') {
                setLiveUsers(0)
            }
        } catch (err) {
            setError('Unable to load bid data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (diamondId) {
            fetchBids()
        }
    }, [diamondId, token])

    const handleDeclareResult = () => {
        setConfirmState({ show: true, loading: false, error: null })
    }

    const confirmDeclareResult = async () => {
        try {
            setConfirmState((prev) => ({ ...prev, loading: true, error: null }))

            const response = await fetch(`${API_BASE_URL}/admin/results/${diamondId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData?.message || 'Failed to declare result.')
            }

            setConfirmState({ show: false, loading: false, error: null })
            navigate('/admin/diamonds', { replace: true })
        } catch (err) {
            setConfirmState((prev) => ({
                ...prev,
                loading: false,
                error: (err as Error).message || 'Failed to declare result.',
            }))
        }
    }

    const cancelDeclare = () => {
        setConfirmState({ show: false, loading: false, error: null })
    }

    if (loading) {
        return <p className="text-sm text-gray-600">Loading bid data...</p>
    }

    if (error || !data) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error || 'Bid data not found.'}
            </div>
        )
    }

    const { diamond, bids } = data
    const canDeclareResult = diamond.status === 'CLOSED'
    const hasNoBids = bids.length === 0
    const highestBidUserId = data.highest_bid_user_id || (bids.length > 0 ? bids[0].user_id : null)

    return (
        <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm">
                <button
                    onClick={() => navigate(sourceFrom === 'bids' ? '/admin/bids' : '/admin/diamonds')}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    {sourceFrom === 'bids' ? 'Monitor My Bids' : 'View Diamonds'}
                </button>
                <span className="text-gray-400">/</span>
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                >
                    Dashboard
                </button>
            </div>

            {/* Diamond Header */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">{diamond.diamond_name}</h1>
                    <div className="flex items-center gap-4">
                        {/* Real-time Connection Indicator */}
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <>
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                                    </span>
                                    <span className="text-xs font-semibold text-green-700">Live Updates</span>
                                    {diamond.status === 'ACTIVE' && liveUsers > 0 && (
                                        <div className="ml-2 flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5 text-blue-600">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                            </svg>
                                            <span className="text-xs font-semibold text-blue-700">{liveUsers}</span>
                                        </div>
                                    )}
                                    {diamond.status !== 'ACTIVE' && (
                                        <div className="ml-2 flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                                            <span className="text-xs font-semibold text-gray-600">0</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                                    <span className="text-xs font-medium text-gray-600">Connecting...</span>
                                </>
                            )}
                        </div>

                        <span
                            className={`rounded-full px-3 py-1 text-sm font-semibold ${diamond.status === 'DRAFT'
                                ? 'bg-gray-100 text-gray-800'
                                : diamond.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-800'
                                    : diamond.status === 'CLOSED'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-purple-100 text-purple-800'
                                }`}
                        >
                            {diamond.status}
                        </span>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Base Price</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900">
                            ${diamond.base_price.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Bid End Time</p>
                        <p className="mt-1 text-sm text-gray-900">{formatDateTime(diamond.bid_end_time)}</p>
                    </div>
                </div>
            </div>

            {/* Winner Information (if SOLD) */}
            {data?.winner && (diamond.status === 'SOLD' || diamond.status === 'CLOSED') && (
                <div className="rounded-lg border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6 text-yellow-600">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <h2 className="text-xl font-bold text-yellow-800">🏆 WINNER</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-yellow-700">Winner Name</p>
                            <p className="mt-1 text-lg font-semibold text-yellow-900">{data.winner.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-yellow-700">Email</p>
                            <p className="mt-1 text-lg font-semibold text-yellow-900">{data.winner.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-yellow-700">Winning Amount</p>
                            <p className="mt-1 text-lg font-semibold text-yellow-900">
                                ${data.winner.winning_amount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Bids Table */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Bids</h2>

                {hasNoBids ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
                        <p className="text-sm text-gray-600">No bids placed for this diamond.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        User Name
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                                        Bid Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Last Updated
                                    </th>
                                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {bids.map((bid) => {
                                    const isHighestBid = bid.user_id === highestBidUserId

                                    return (
                                        <tr
                                            key={bid.id}
                                            className={isHighestBid ? 'bg-blue-50' : 'hover:bg-gray-50'}
                                        >
                                            <td className={`px-6 py-4 text-sm font-medium ${isHighestBid ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {bid.user_name}
                                            </td>
                                            <td className={`px-6 py-4 text-right text-sm font-semibold ${isHighestBid ? 'text-blue-900' : 'text-gray-900'}`}>
                                                ${bid.bid_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDateTime(bid.updated_at)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isHighestBid && (
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                        Highest Bid
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isHighestBid && (
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                        ✓ Winner
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Close Bid Section (for ACTIVE diamonds) */}
            {diamond.status === 'ACTIVE' && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                    <h3 className="text-lg font-semibold text-yellow-900">Close Bid</h3>
                    <p className="mt-2 text-sm text-yellow-700">
                        Close the bidding for this diamond to stop accepting new bids.
                    </p>
                    <button
                        type="button"
                        onClick={() => setConfirmState({ show: true, loading: false, error: null })}
                        className="mt-4 rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
                    >
                        Close Bid Early
                    </button>
                </div>
            )}

            {/* Declare Result Section */}
            {canDeclareResult && !hasNoBids && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                    <h3 className="text-lg font-semibold text-blue-900">Declare Result</h3>
                    <p className="mt-2 text-sm text-blue-700">
                        The highest bidder will be determined automatically. Click below to finalize the result.
                    </p>
                    <button
                        type="button"
                        onClick={handleDeclareResult}
                        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Declare Winner
                    </button>
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmState.show && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg max-w-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Declare Result</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to declare the result for this diamond? The highest bidder will be marked as the winner.
                        </p>

                        {confirmState.error && (
                            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                {confirmState.error}
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={cancelDeclare}
                                disabled={confirmState.loading}
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeclareResult}
                                disabled={confirmState.loading}
                                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {confirmState.loading ? 'Declaring...' : 'Declare Winner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BidMonitoring
