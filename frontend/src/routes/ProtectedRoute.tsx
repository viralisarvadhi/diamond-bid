import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'

interface ProtectedRouteProps {
    allowedRoles: string[]
    requireActive?: boolean
    children?: React.ReactNode
}

const getFallbackRoute = (role?: string) => {
    if (role === 'ADMIN') {
        return '/admin/dashboard'
    }
    if (role === 'USER') {
        return '/user/dashboard'
    }
    return '/login'
}

const InactiveUserNotice: React.FC = () => {
    return (
        <div style={{ padding: '2rem' }}>
            <h2>Account Deactivated</h2>
            <p>Your account is inactive. You can browse, but bidding is disabled.</p>
        </div>
    )
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles,
    requireActive = false,
    children,
}) => {
    const { token, user } = useAppSelector((state) => state.auth)
    const isAuthenticated = Boolean(token)

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />
    }

    const role = user.role as string | undefined
    const isActive = user.is_active as boolean | undefined

    if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
        return <Navigate to={getFallbackRoute(role)} replace />
    }

    if (requireActive && isActive === false) {
        return <InactiveUserNotice />
    }

    if (children) {
        return <>{children}</>
    }

    return <Outlet />
}

export default ProtectedRoute
