import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { authService } from '../../services'
import { loginSuccess } from '../../store/slices/authSlice'

interface LoginFormState {
    email: string
    password: string
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

const Login: React.FC = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [form, setForm] = useState<LoginFormState>({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.currentTarget
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        const email = form.email.trim()
        const password = form.password.trim()

        if (!email || !password) {
            setError('Email and password are required.')
            return
        }

        try {
            setLoading(true)
            const response = await authService.login(email, password)
            const data = response.data.data
            const token = data?.token
            const user = data?.user

            if (!token || !user) {
                setError('Invalid login response. Please try again.')
                return
            }

            // Store token and user in Redux
            dispatch(loginSuccess({ token, user }))

            // Redirect based on user role
            const role = user?.role

            if (role === 'ADMIN') {
                navigate('/admin/dashboard', { replace: true })
                return
            }

            navigate('/user/dashboard', { replace: true })
        } catch (err) {
            console.error('Login error:', err)
            const errorMsg = (err as any)?.response?.data?.message || (err as Error).message
            setError(errorMsg || 'Invalid credentials or server unavailable.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
                <h1 className="mb-6 text-center text-2xl font-semibold text-gray-900">Login</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="you@example.com"
                            autoComplete="email"
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
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Sign Up Now
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
