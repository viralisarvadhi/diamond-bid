import ApiService from '../configs/ApiService'

class AuthService {
  public async login(email: string, password: string) {
    return ApiService.post('/auth/login', { email, password })
  }

  public logout() {
    return ApiService.post('/auth/logout', {})
  }

  public register(userData: any) {
    return ApiService.post('/auth/register', userData)
  }

  public refreshToken() {
    return ApiService.post('/auth/refresh', { action: 'refresh' })
  }
}

export default new AuthService()
