import React from 'react'
import DiamondList from './DiamondList'

const UserDiamonds: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Available Diamonds</h1>
                <p className="text-sm text-gray-600">View all diamonds and their bidding status.</p>
            </div>
            <DiamondList />
        </div>
    )
}

export default UserDiamonds
