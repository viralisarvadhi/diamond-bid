import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { token, user } = useAppSelector((state) => state.auth)
  const role = user?.role
  const isAuthenticated = Boolean(token && role)

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center max-w-md px-6">
        <h1 className="text-5xl font-bold text-white mb-4">💎 Diamond Bid</h1>
        <p className="text-xl text-blue-100 mb-8">
          A secure auction platform for premium diamond bidding
        </p>

        <div className="space-y-3">
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition"
              >
                🔑 Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-600 transition border-2 border-white shadow-lg transform hover:scale-105"
              >
                ✨ Create New Account
              </button>
              <p className="text-blue-100 text-sm mt-4">
                👤 New to Diamond Bid? Sign up now to start bidding on premium diamonds!
              </p>
              <div className="bg-blue-700 bg-opacity-50 rounded-lg p-3 mt-4">
                <p className="text-blue-50 text-xs">
                  💳 Secure • 🔒 Verified • ✅ Trusted
                </p>
              </div>
            </>
          ) : (
            <>
              {role === 'USER' && (
                <button
                  onClick={() => navigate('/user/dashboard')}
                  className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition"
                >
                  Go to User Dashboard
                </button>
              )}
              {role === 'ADMIN' && (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition"
                >
                  Go to Admin Dashboard
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-blue-300 text-blue-100 text-sm">
          <p>© 2026 Diamond Bid. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Home
