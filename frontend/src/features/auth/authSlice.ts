import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthUser {
    id: number
    name: string
    role: 'ADMIN' | 'USER'
    is_active: boolean
    budget: number
}

interface AuthState {
    token: string | null
    user: AuthUser | null
}

interface TokenPayload {
    userId?: number | string
    id?: number | string
    name?: string
    role?: 'ADMIN' | 'USER'
    is_active?: boolean
    budget?: number
}

const decodeToken = (token: string): TokenPayload | null => {
    try {
        const [, payload] = token.split('.')
        if (!payload) return null
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
        const decoded = atob(normalized)
        return JSON.parse(decoded) as TokenPayload
    } catch {
        return null
    }
}

const buildUserFromToken = (token: string): AuthUser | null => {
    const payload = decodeToken(token)
    if (!payload) return null

    const idValue = payload.userId ?? payload.id
    const id = typeof idValue === 'number' ? idValue : Number(idValue)

    return {
        id: Number.isFinite(id) ? id : 0,
        name: payload.name ?? 'User',
        role: payload.role ?? 'USER',
        is_active: payload.is_active ?? true,
        budget: payload.budget ?? 0,
    }
}

const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
const storedUser = storedToken ? buildUserFromToken(storedToken) : null

const initialState: AuthState = {
    token: storedToken,
    user: storedUser,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action: PayloadAction<{ token: string }>) => {
            const { token } = action.payload
            state.token = token
            state.user = buildUserFromToken(token)
            localStorage.setItem('token', token)
        },
        logout: (state) => {
            state.token = null
            state.user = null
            localStorage.removeItem('token')
        },
    },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
