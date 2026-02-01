import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { logout } from '../../store/slices/authSlice'

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

export default LogoutButton
