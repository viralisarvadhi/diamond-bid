import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { API_BASE_URL } from '../../utils/constants'
import { useBidSocket } from '../../hooks/useBidSocket'

interface DiamondDetail {
    id: string
    diamond_name: string
    base_price: number
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'SOLD' | string
    bid_start_time?: string
    bid_end_time?: string
    result_status?: 'PENDING' | 'DECLARED' | string
    user_bid?: {
        id?: string
        bid_amount?: number
        updated_at?: string
        result?: 'WON' | 'LOST'
        is_winner?: boolean
    } | null
}

const formatDateTime = (value?: string) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString()
}

const isBidTimeOver = (endTime?: string) => {
    if (!endTime) return false
    const now = new Date()
    const end = new Date(endTime)
    return now > end
}

const BidPage: React.FC = () => {
    const { diamondId } = useParams<{ diamondId: string }>()
    const navigate = useNavigate()
    const { token, user } = useAppSelector((state) => state.auth)

    const [diamond, setDiamond] = useState<DiamondDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [bidAmount, setBidAmount] = useState<string>('')
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState(false)
    const [liveUsers, setLiveUsers] = useState<number>(0)
    const [lastUpdate, setLastUpdate] = useState<string | null>(null)

    const { isConnected } = useBidSocket({
        diamondId,
        onBidPlaced: (data) => {
            console.log('New bid received:', data)
            setLastUpdate(new Date().toLocaleTimeString())
            // Optionally refetch diamond data to show latest bid
            if (data.diamond_id === diamondId) {
                fetchDiamond()
            }
        },
        onBidUpdated: (data) => {
            console.log('Bid updated:', data)
            setLastUpdate(new Date().toLocaleTimeString())
            if (data.diamond_id === diamondId) {
                fetchDiamond()
            }
        },
        onActiveUsersUpdate: (data) => {
            console.log('Active users update:', data)
            if (data.diamondId === diamondId) {
                setLiveUsers(data.count)
            }
        },
    })

    const isActiveUser = user?.is_active !== false
    const isActive = diamond?.status === 'ACTIVE'
    const timeOver = isBidTimeOver(diamond?.bid_end_time)
    const canBid = isActive && isActiveUser && !timeOver

    const fetchDiamond = async () => {
        let isMounted = true
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE_URL}/user/diamonds/${diamondId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            })

            if (!response.ok) {
                throw new Error('Unable to load diamond details.')
            }

            const data = await response.json()
            const diamondData = data?.data || data?.diamond || data

            if (isMounted) {
                setDiamond(diamondData)
                if (diamondData?.user_bid?.bid_amount) {
                    setBidAmount(diamondData.user_bid.bid_amount.toString())
                }
            }
        } catch (err) {
            if (isMounted) {
                setError('Unable to load diamond details.')
            }
        } finally {
            if (isMounted) {
                setLoading(false)
            }
        }
    }

    useEffect(() => {
        if (diamondId) {
            fetchDiamond()
        }
    }, [diamondId, token])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitError(null)
        setSubmitSuccess(false)

        const amount = parseFloat(bidAmount.trim())
        if (!bidAmount.trim() || amount <= 0) {
            setSubmitError('Bid amount must be greater than 0.')
            return
        }

        if (!diamond) {
            setSubmitError('Diamond not found.')
            return
        }

        try {
            setSubmitting(true)

            const isUpdate = !!diamond.user_bid?.id
            const method = isUpdate ? 'PUT' : 'POST'
            const url = isUpdate && diamond.user_bid?.id
                ? `${API_BASE_URL}/user/bid/${diamond.user_bid.id}`
                : `${API_BASE_URL}/user/bid`

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    diamond_id: diamond.id,
                    bid_amount: amount,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData?.message || 'Failed to place bid.')
            }

            setSubmitSuccess(true)
            setTimeout(() => {
                navigate('/user/diamonds', { replace: true })
            }, 1500)
        } catch (err) {
            setSubmitError((err as Error).message || 'Failed to place bid.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-600">Loading diamond details...</p>
            </div>
        )
    }

    if (error || !diamond) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error || 'Diamond not found.'}
            </div>
        )
    }

    const hasExistingBid = !!diamond.user_bid?.bid_amount
    const buttonLabel = hasExistingBid ? 'Update Bid' : 'Place Bid'
    const resultMessage = (() => {
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
    })()

    return (
        <div className="max-w-2xl space-y-6">
            {/* Live Status Indicator */}
            {isActive && (
                <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                {isConnected ? (
                                    <>
                                        <span className="relative flex h-3 w-3">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                                        </span>
                                        <span className="text-sm font-semibold text-green-700">LIVE</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="h-3 w-3 rounded-full bg-gray-400"></span>
                                        <span className="text-sm font-medium text-gray-600">Connecting...</span>
                                    </>
                                )}
                            </div>
                            {isConnected && liveUsers > 0 && (
                                <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 text-blue-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-gray-700">{liveUsers} {liveUsers === 1 ? 'user' : 'users'} viewing</span>
                                </div>
                            )}
                        </div>
                        {lastUpdate && (
                            <span className="text-xs text-gray-500">Last update: {lastUpdate}</span>
                        )}
                    </div>
                    <p className="mt-2 text-xs text-blue-700">🔄 Real-time bid updates enabled</p>
                </div>
            )}

            {/* Diamond Details Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">{diamond.diamond_name}</h1>
                    <div className="flex items-center gap-2">
                        {timeOver && isActive && (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
                                TIME OVER
                            </span>
                        )}
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
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
                    {hasExistingBid && (
                        <div>
                            <p className="text-sm text-gray-600">Your Current Bid</p>
                            <p className="mt-1 text-xl font-semibold text-blue-600">
                                ${diamond.user_bid?.bid_amount?.toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                    <div>
                        <p className="text-sm text-gray-600">Bid Start</p>
                        <p className="mt-1 text-sm text-gray-900">{formatDateTime(diamond.bid_start_time)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Bid End</p>
                        <p className="mt-1 text-sm text-gray-900">{formatDateTime(diamond.bid_end_time)}</p>
                    </div>
                </div>

                {hasExistingBid && diamond.user_bid?.updated_at && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="mt-1 text-sm text-gray-900">
                            {formatDateTime(diamond.user_bid.updated_at)}
                        </p>
                    </div>
                )}
            </div>

            {/* Result Message */}
            {resultMessage && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-center text-sm font-medium text-purple-700">
                    {resultMessage}
                </div>
            )}

            {/* Bid Form */}
            {canBid ? (
                <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
                    <div>
                        <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700">
                            Bid Amount
                        </label>
                        <div className="mt-2 relative">
                            <span className="absolute left-3 top-3 text-gray-500">$</span>
                            <input
                                id="bidAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.currentTarget.value)}
                                disabled={submitting}
                                className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="0.00"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Must be greater than base price (${diamond.base_price.toLocaleString()})
                        </p>
                    </div>

                    {submitError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {submitError}
                        </div>
                    )}

                    {submitSuccess && (
                        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600">
                            {hasExistingBid ? 'Bid updated successfully' : 'Bid placed successfully'}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? 'Submitting...' : buttonLabel}
                    </button>
                </form>
            ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-6 text-center">
                    {timeOver && (
                        <p className="mb-2 text-sm font-semibold text-red-600">
                            ⏰ Bidding time is over. Waiting for admin to close and declare result.
                        </p>
                    )}
                    {!isActiveUser && (
                        <p className="text-sm text-gray-600">
                            Your account is deactivated by admin. You cannot place bids.
                        </p>
                    )}
                    {!isActive && !timeOver && (
                        <p className="text-sm text-gray-600">
                            Bidding is not available for this diamond.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

export default BidPage
