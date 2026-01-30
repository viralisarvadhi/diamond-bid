import React from 'react'
import { useParams } from 'react-router-dom'

const AdminResult: React.FC = () => {
    const { diamondId } = useParams()

    return (
        <div>
            <h1>Declare Result</h1>
            <p>Diamond ID: {diamondId}</p>
        </div>
    )
}

export default AdminResult
