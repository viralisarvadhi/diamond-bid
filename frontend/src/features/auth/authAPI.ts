import { authService } from '../../services'

interface LoginCredentials {
    email: string
    password: string
}

export const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials.email, credentials.password)
    // response.data is the full response: { success, message, data: { token, user } }
    // Return just the data object which contains { token, user }
    return response.data.data
}
