import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch } from '../store/hooks'
import { logout } from '../store/slices/authSlice'

const LogoutButton: React.FC = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const handleLogout = () => {
        dispatch(logout())
        navigate('/login', { replace: true })
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
            Logout
        </button>
    )
}

const AdminLayout: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const isDashboard = location.pathname === '/admin/dashboard'

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="border-b bg-white px-6 py-4">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
                        {!isDashboard && (
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                                Back to Dashboard
                            </button>
                        )}
                    </div>
                    <LogoutButton />
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-6">
                <Outlet />
            </main>
        </div>
    )
}

export default AdminLayout
