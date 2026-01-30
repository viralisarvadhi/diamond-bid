import React from 'react'
import { useNavigate } from 'react-router-dom'

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate()

    const features = [
        {
            title: 'Users Management',
            description: 'Manage user accounts, activate/deactivate users',
            icon: '👥',
            action: () => navigate('/admin/users'),
            color: 'from-blue-400 to-blue-600',
        },
        {
            title: 'Diamonds',
            description: 'Create diamonds, manage listings, activate/close diamonds',
            icon: '💎',
            action: () => navigate('/admin/diamonds'),
            color: 'from-purple-400 to-purple-600',
        },
        {
            title: 'Create Diamond',
            description: 'Add new diamond to the system',
            icon: '➕',
            action: () => navigate('/admin/diamonds/create'),
            color: 'from-green-400 to-green-600',
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-2 text-lg text-gray-600">Manage diamonds, users, and bids</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, idx) => (
                    <div
                        key={idx}
                        onClick={feature.action}
                        className={`bg-gradient-to-br ${feature.color} rounded-lg shadow-lg hover:shadow-xl transition cursor-pointer transform hover:scale-105 p-6 text-white`}
                    >
                        <div className="text-5xl mb-4">{feature.icon}</div>
                        <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                        <p className="text-white text-opacity-90">{feature.description}</p>
                        <button className="mt-4 bg-white text-gray-800 font-semibold py-2 px-4 rounded hover:bg-gray-100 transition">
                            Open
                        </button>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-12 bg-gray-50 rounded-lg p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/admin/diamonds/create')}
                        className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition text-left"
                    >
                        <div className="text-lg">➕ Create New Diamond</div>
                        <div className="text-sm text-blue-100">Add a new diamond listing</div>
                    </button>
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition text-left"
                    >
                        <div className="text-lg">👥 Manage Users</div>
                        <div className="text-sm text-purple-100">Activate or deactivate user accounts</div>
                    </button>
                    <button
                        onClick={() => navigate('/admin/diamonds')}
                        className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition text-left"
                    >
                        <div className="text-lg">💎 View Diamonds</div>
                        <div className="text-sm text-green-100">View and manage all diamonds</div>
                    </button>
                    <button
                        onClick={() => navigate('/admin/diamonds')}
                        className="bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-700 transition text-left"
                    >
                        <div className="text-lg">📊 Monitor Bids</div>
                        <div className="text-sm text-orange-100">View and declare bid results</div>
                    </button>
                </div>
            </div>

            {/* Information */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 System Features</h3>
                <ul className="space-y-2 text-blue-800">
                    <li>✓ Create and manage diamond listings</li>
                    <li>✓ Manage diamond status (DRAFT → ACTIVE → CLOSED → SOLD)</li>
                    <li>✓ Activate/deactivate user accounts</li>
                    <li>✓ Monitor all bids placed by users</li>
                    <li>✓ Declare winners with automatic tie-breaking</li>
                    <li>✓ View bid history and audit trail</li>
                </ul>
            </div>
        </div>
    )
}

export default AdminDashboard
