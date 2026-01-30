import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import { API_BASE_URL } from '../../utils/constants'

const CreateDiamond: React.FC = () => {
    const navigate = useNavigate()
    const { token } = useAppSelector((state) => state.auth)

    const [form, setForm] = useState({
        diamond_name: '',
        base_price: '',
        bid_start_time: '',
        bid_end_time: '',
    })

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.currentTarget
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        const { diamond_name, base_price, bid_start_time, bid_end_time } = form

        if (!diamond_name.trim() || !base_price || !bid_start_time || !bid_end_time) {
            setError('All fields are required.')
            return
        }

        const basePrice = parseFloat(base_price)
        if (basePrice <= 0) {
            setError('Base price must be greater than 0.')
            return
        }

        const startTime = new Date(bid_start_time)
        const endTime = new Date(bid_end_time)

        if (endTime <= startTime) {
            setError('Bid end time must be after start time.')
            return
        }

        try {
            setSubmitting(true)

            const response = await fetch(`${API_BASE_URL}/admin/diamonds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    diamond_name: diamond_name.trim(),
                    base_price: basePrice,
                    bid_start_time,
                    bid_end_time,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData?.message || 'Failed to create diamond.')
            }

            navigate('/admin/diamonds', { replace: true })
        } catch (err) {
            setError((err as Error).message || 'Failed to create diamond.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-2xl">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h1 className="text-2xl font-semibold text-gray-900">Create Diamond</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Set up a new diamond auction. It will start in DRAFT status.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="diamond_name" className="block text-sm font-medium text-gray-700">
                            Diamond Name
                        </label>
                        <input
                            id="diamond_name"
                            name="diamond_name"
                            type="text"
                            value={form.diamond_name}
                            onChange={handleChange}
                            disabled={submitting}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="e.g., Blue Diamond 5 Carat"
                        />
                    </div>

                    <div>
                        <label htmlFor="base_price" className="block text-sm font-medium text-gray-700">
                            Base Bid Price ($)
                        </label>
                        <input
                            id="base_price"
                            name="base_price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.base_price}
                            onChange={handleChange}
                            disabled={submitting}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="bid_start_time" className="block text-sm font-medium text-gray-700">
                                Bid Start Time
                            </label>
                            <input
                                id="bid_start_time"
                                name="bid_start_time"
                                type="datetime-local"
                                value={form.bid_start_time}
                                onChange={handleChange}
                                disabled={submitting}
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label htmlFor="bid_end_time" className="block text-sm font-medium text-gray-700">
                                Bid End Time
                            </label>
                            <input
                                id="bid_end_time"
                                name="bid_end_time"
                                type="datetime-local"
                                value={form.bid_end_time}
                                onChange={handleChange}
                                disabled={submitting}
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/diamonds')}
                            disabled={submitting}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Creating...' : 'Create Diamond'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateDiamond
