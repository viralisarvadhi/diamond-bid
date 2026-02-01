import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { useAppSelector } from '../store/hooks'
import { API_BASE_URL } from '../utils/constants'

interface UseBidSocketOptions {
    diamondId?: string
    onBidPlaced?: (bidData: any) => void
    onBidUpdated?: (bidData: any) => void
    onActiveUsersUpdate?: (data: { diamondId: string; count: number }) => void
}

export const useBidSocket = ({ diamondId, onBidPlaced, onBidUpdated, onActiveUsersUpdate }: UseBidSocketOptions) => {
    const { token } = useAppSelector((state) => state.auth)
    const socketRef = useRef<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const callbacksRef = useRef({ onBidPlaced, onBidUpdated, onActiveUsersUpdate, diamondId })

    // Update callbacks without causing reconnection
    useEffect(() => {
        callbacksRef.current = { onBidPlaced, onBidUpdated, onActiveUsersUpdate, diamondId }
    }, [onBidPlaced, onBidUpdated, onActiveUsersUpdate, diamondId])

    useEffect(() => {
        if (!token) {
            return
        }

        // Prevent multiple connections
        if (socketRef.current?.connected) {
            return
        }

        try {
            const socketUrl = API_BASE_URL.replace('/api', '')
            const newSocket = io(socketUrl, {
                auth: {
                    token,
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
            })

            newSocket.on('connect', () => {
                console.log('✓ Socket connected')
                setIsConnected(true)

                // Join diamond room if diamondId is specified
                if (callbacksRef.current.diamondId) {
                    console.log(`Joining diamond room: ${callbacksRef.current.diamondId}`)
                    newSocket.emit('join_diamond', callbacksRef.current.diamondId)
                }
            })

            newSocket.on('disconnect', () => {
                console.log('✗ Socket disconnected')
                setIsConnected(false)
            })

            newSocket.on('active_users_update', (data) => {
                console.log('👥 Active users update:', data)
                callbacksRef.current.onActiveUsersUpdate?.(data)
            })

            newSocket.on('bid_placed', (data) => {
                console.log('📍 Real-time bid placed:', data)
                // Filter bids for current diamond if diamondId is specified
                if (!callbacksRef.current.diamondId || data.diamond_id === callbacksRef.current.diamondId) {
                    callbacksRef.current.onBidPlaced?.(data)
                }
            })

            newSocket.on('bid_updated', (data) => {
                console.log('📍 Real-time bid updated:', data)
                // Filter bids for current diamond if diamondId is specified
                if (!callbacksRef.current.diamondId || data.diamond_id === callbacksRef.current.diamondId) {
                    callbacksRef.current.onBidUpdated?.(data)
                }
            })

            newSocket.on('error', (error) => {
                console.error('Socket error:', error)
            })

            socketRef.current = newSocket
        } catch (error) {
            console.error('Failed to connect socket:', error)
        }

        return () => {
            if (socketRef.current) {
                // Leave diamond room before disconnecting
                if (callbacksRef.current.diamondId) {
                    console.log(`Leaving diamond room: ${callbacksRef.current.diamondId}`)
                    socketRef.current.emit('leave_diamond', callbacksRef.current.diamondId)
                }
                socketRef.current.disconnect()
                socketRef.current = null
                setIsConnected(false)
            }
        }
    }, [token])

    return { socket: socketRef.current, isConnected }
}
