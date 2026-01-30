import React from 'react'
import { useParams } from 'react-router-dom'

const UserBid: React.FC = () => {
    const { diamondId } = useParams()

    return (
        <div>
            <h1>Place Bid</h1>
            <p>Diamond ID: {diamondId}</p>
        </div>
    )
}

export default UserBid
