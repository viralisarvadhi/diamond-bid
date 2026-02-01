import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import { API_BASE_URL } from '../../utils/constants'

interface UserBid {
    bid_amount?: number
    result?: 'WON' | 'LOST'
    is_winner?: boolean
    updated_at?: string
}

interface DiamondItem {
    id: string
    diamond_name: string
    base_price: number
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'SOLD' | string
    bid_start_time?: string
    bid_end_time?: string
    result_status?: 'PENDING' | 'DECLARED' | string
    user_bid?: (UserBid & { result?: 'WON' | 'LOST'; is_winner?: boolean }) | null
}

const formatDateTime = (value?: string) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString()
}

const getStatusBadge = (status: string) => {
    switch (status) {
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

const MyBids: React.FC = () => {
    const { token } = useAppSelector((state) => state.auth)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [bids, setBids] = useState<DiamondItem[]>([])

    const fetchMyBids = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE_URL}/user/diamonds`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            })

            if (!response.ok) {
                throw new Error('Unable to load your bids. Please try again.')
            }

            const data = await response.json()
            const allDiamonds = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.diamonds)
                        ? data.diamonds
                        : []

            // Filter to only diamonds where user has placed a bid
            const myBids = allDiamonds.filter((diamond: DiamondItem) => diamond.user_bid)

            // Sort by bid_end_time DESC (newest first)
            const sorted = myBids.sort((a: DiamondItem, b: DiamondItem) => {
                const dateA = new Date(a.bid_end_time || 0).getTime()
                const dateB = new Date(b.bid_end_time || 0).getTime()
                return dateB - dateA
            })

            setBids(sorted)
        } catch (err) {
            setError('Unable to load your bids. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) {
            fetchMyBids()
        }
    }, [token])

    const emptyState = !loading && !error && bids.length === 0

    const renderResultMessage = (diamond: DiamondItem) => {
        if (diamond.status === 'CLOSED' && diamond.result_status !== 'DECLARED') {
            return 'Result will be declared soon'
        }

        if (diamond.status === 'SOLD' || diamond.result_status === 'DECLARED') {
            if (diamond.user_bid?.is_winner || diamond.user_bid?.result === 'WON') {
                return '🏆 You won this bid!'
            }
            if (diamond.user_bid) {
                return '❌ You lost this bid'
            }
            return 'Result declared'
        }

        return null
    }

    if (loading) {
        return <p className="text-sm text-gray-600">Loading your bids...</p>
    }

    if (error) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
            </div>
        )
    }

    if (emptyState) {
        return (
            <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
                <div className="text-4xl mb-2">💎</div>
                <p className="text-lg font-medium text-gray-900">No Bids Placed Yet</p>
                <p className="mt-1 text-sm text-gray-600">Start bidding on available diamonds!</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">My Bids</h2>
                    <p className="text-sm text-gray-600">Diamonds you have bid on</p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchMyBids()}
                    disabled={loading}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bids.map((diamond) => {
                    const resultMessage = renderResultMessage(diamond)

                    return (
                        <div
                            key={diamond.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {diamond.diamond_name}
                                </h3>
                                <span
                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(
                                        diamond.status
                                    )}`}
                                >
                                    {diamond.status}
                                </span>
                            </div>

                            <div className="mt-3 space-y-2 text-sm text-gray-600">
                                <p>Base Price: ${diamond.base_price.toLocaleString()}</p>
                                <p>Your Bid: ${diamond.user_bid?.bid_amount?.toLocaleString()}</p>
                                <p>Last Updated: {formatDateTime(diamond.user_bid?.updated_at)}</p>
                                <p>Bid End: {formatDateTime(diamond.bid_end_time)}</p>
                            </div>

                            {resultMessage && (
                                <div
                                    className={`mt-3 rounded-md px-3 py-2 text-sm font-medium ${diamond.user_bid?.result === 'WON'
                                        ? 'bg-green-50 text-green-700'
                                        : diamond.user_bid?.result === 'LOST'
                                            ? 'bg-red-50 text-red-700'
                                            : 'bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    {resultMessage}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default MyBids
