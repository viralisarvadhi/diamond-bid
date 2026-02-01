import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { API_BASE_URL } from '../../utils/constants'

interface UserBid {
    bid_amount?: number
    result?: 'WON' | 'LOST'
    is_winner?: boolean
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

const isBidTimeOver = (endTime?: string) => {
    if (!endTime) return false
    const now = new Date()
    const end = new Date(endTime)
    return now > end
}

const DiamondList: React.FC = () => {
    const { token, user } = useAppSelector((state) => state.auth)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [diamonds, setDiamonds] = useState<DiamondItem[]>([])

    const isActiveUser = user?.is_active !== false

    const fetchDiamonds = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE_URL}/user/diamonds`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            })

            if (!response.ok) {
                throw new Error('Unable to load diamonds. Please try again.')
            }

            const data = await response.json()
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.diamonds)
                        ? data.diamonds
                        : []

            // Sort by bid_end_time DESC (newest first)
            const sorted = list.sort((a: DiamondItem, b: DiamondItem) => {
                const dateA = new Date(a.bid_end_time || 0).getTime()
                const dateB = new Date(b.bid_end_time || 0).getTime()
                return dateB - dateA
            })

            setDiamonds(sorted)
        } catch (err) {
            setError('Unable to load diamonds. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let isMounted = true

        if (isMounted) {
            fetchDiamonds()
        }

        return () => {
            isMounted = false
        }
    }, [token])

    const emptyState = !loading && !error && diamonds.length === 0

    const deactivatedNotice = useMemo(() => {
        if (isActiveUser) return null
        return (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                Your account is deactivated by admin. You can browse but cannot bid.
            </div>
        )
    }, [isActiveUser])

    const renderResultMessage = (diamond: DiamondItem) => {
        if (diamond.status === 'CLOSED' && diamond.result_status !== 'DECLARED') {
            return 'Result will be declared soon'
        }

        if (diamond.status === 'SOLD' || diamond.result_status === 'DECLARED') {
            if (diamond.user_bid?.is_winner || diamond.user_bid?.result === 'WON') {
                return 'You won this bid'
            }
            if (diamond.user_bid) {
                return 'You lost this bid'
            }
            return 'Result declared'
        }

        return null
    }

    return (
        <div className="space-y-4">
            {deactivatedNotice}

            <div className="flex items-center justify-between">
                <div>
                    {loading && <p className="text-sm text-gray-600">Loading diamonds...</p>}
                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => fetchDiamonds()}
                    disabled={loading}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {emptyState && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center">
                    <div className="text-4xl mb-2">💎</div>
                    <p className="text-lg font-medium text-gray-900">No Diamonds Available</p>
                    <p className="mt-1 text-sm text-gray-600">Check back soon for new listings!</p>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {diamonds.map((diamond) => {
                    const isActive = diamond.status === 'ACTIVE'
                    const timeOver = isBidTimeOver(diamond.bid_end_time)
                    const buttonLabel = diamond.user_bid ? 'Edit Bid' : 'Bid Now'
                    const resultMessage = renderResultMessage(diamond)
                    const disableBid = !isActive || !isActiveUser || timeOver

                    return (
                        <div
                            key={diamond.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {diamond.diamond_name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {timeOver && isActive && (
                                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                                            TIME OVER
                                        </span>
                                    )}
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(
                                            diamond.status
                                        )}`}
                                    >
                                        {diamond.status}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2 text-sm text-gray-600">
                                <p>Base Price: ${diamond.base_price.toLocaleString()}</p>
                                <p>Start: {formatDateTime(diamond.bid_start_time)}</p>
                                <p>End: {formatDateTime(diamond.bid_end_time)}</p>
                                {diamond.user_bid?.bid_amount && (
                                    <p>Your bid: ${diamond.user_bid.bid_amount.toLocaleString()}</p>
                                )}
                            </div>

                            {resultMessage && (
                                <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                    {resultMessage}
                                </div>
                            )}

                            <div className="mt-4">
                                {diamond.status === 'SOLD' || diamond.status === 'CLOSED' ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400"
                                    >
                                        Bidding Closed
                                    </button>
                                ) : timeOver ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
                                    >
                                        Time Over - Bidding Closed
                                    </button>
                                ) : disableBid ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400"
                                    >
                                        {buttonLabel}
                                    </button>
                                ) : (
                                    <Link
                                        to={`/user/bid/${diamond.id}`}
                                        className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        {buttonLabel}
                                    </Link>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default DiamondList
