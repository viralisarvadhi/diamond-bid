import React from 'react'
import { useNavigate } from 'react-router-dom'
import DiamondList from './DiamondList'

const UserDashboard: React.FC = () => {
    const navigate = useNavigate()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-gray-900">User Dashboard</h1>
                <p className="mt-2 text-lg text-gray-600">Browse available diamonds and place your bids</p>
            </div>

            {/* Quick Stats/Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">💎 Active Diamonds</h3>
                    <p className="text-blue-100">Browse and bid on available diamonds</p>
                    <button
                        onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}
                        className="mt-4 bg-white text-blue-600 font-semibold py-2 px-4 rounded hover:bg-gray-100 transition"
                    >
                        View Diamonds
                    </button>
                </div>

                <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">📋 My Bids</h3>
                    <p className="text-purple-100">View all diamonds you have bid on</p>
                    <button
                        onClick={() => navigate('/user/my-bids')}
                        className="mt-4 bg-white text-purple-600 font-semibold py-2 px-4 rounded hover:bg-gray-100 transition"
                    >
                        View My Bids
                    </button>
                </div>
            </div>

            {/* How to Bid */}
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📖 How to Bid</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-4xl mb-3">1️⃣</div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">Browse Diamonds</h3>
                        <p className="text-gray-600">View all available diamonds below</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-3">2️⃣</div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">Place a Bid</h3>
                        <p className="text-gray-600">Click on a diamond and enter your bid amount</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-3">3️⃣</div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">Wait for Result</h3>
                        <p className="text-gray-600">Admin declares the winner after bidding closes</p>
                    </div>
                </div>
            </div>

            {/* Diamonds List */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">💎 Available Diamonds</h2>
                <DiamondList />
            </div>
        </div>
    )
}

export default UserDashboard
