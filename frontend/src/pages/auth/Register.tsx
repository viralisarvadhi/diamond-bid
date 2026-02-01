import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { loginSuccess } from '../../store/slices/authSlice'

interface RegisterFormState {
    name: string
    email: string
    password: string
    confirmPassword: string
    budget: string
}

const decodeToken = (token: string) => {
    try {
        const [, payload] = token.split('.')
        if (!payload) return null
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = atob(normalized)
        return JSON.parse(decoded) as { role?: 'ADMIN' | 'USER' }
    } catch {
        return null
    }
}

const Register: React.FC = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [form, setForm] = useState<RegisterFormState>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        budget: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.currentTarget
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        const name = form.name.trim()
        const email = form.email.trim()
        const password = form.password.trim()
        const confirmPassword = form.confirmPassword.trim()
        const budget = form.budget.trim()

        if (!name || !email || !password || !confirmPassword || !budget) {
            setError('All fields are required.')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        const budgetNum = parseFloat(budget)
        if (isNaN(budgetNum) || budgetNum <= 0) {
            setError('Budget must be a positive number.')
            return
        }

        try {
            setLoading(true)
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    budget: budgetNum,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData?.message || 'Registration failed')
            }

            const data = await response.json()
            const token = data?.data?.token
            const user = data?.data?.user

            if (!token || !user) {
                setError('Invalid registration response. Please try again.')
                return
            }

            setSuccess(true)
            dispatch(loginSuccess({ token, user }))

            // Auto-login and redirect
            const role = user?.role
            setTimeout(() => {
                if (role === 'ADMIN') {
                    navigate('/admin/dashboard', { replace: true })
                } else {
                    navigate('/user/dashboard', { replace: true })
                }
            }, 1000)
        } catch (err) {
            console.error('Register error:', err)
            const errorMsg = (err as Error).message
            setError(errorMsg || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
                    <div className="text-center">
                        <h1 className="mb-2 text-2xl font-semibold text-green-600">✓ Registration Successful!</h1>
                        <p className="text-gray-600">Redirecting to your dashboard...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
                <h1 className="mb-6 text-center text-2xl font-semibold text-gray-900">Create Account</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="At least 6 characters"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="Confirm password"
                        />
                    </div>

                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                            Budget (USD)
                        </label>
                        <input
                            id="budget"
                            name="budget"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.budget}
                            onChange={handleChange}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., 50000"
                        />
                    </div>

                    {error && (
                        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>

                    <div className="text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Login here
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Register
