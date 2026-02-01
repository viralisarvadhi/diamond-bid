# Real-Time Bid Updates Feature

## Overview

This feature enables admins to see bids in real-time as users place or update them. When a user places a new bid or updates their existing bid, all connected admins viewing the bid monitoring page will see the update instantly without needing to refresh.

## Architecture

### Backend

#### Socket.IO Setup (`src/utils/socket.js`)
- Initializes a Socket.IO server with JWT authentication
- Creates an `admin_bids` room where all connected admins join automatically
- Handles authentication using JWT tokens from request headers

#### Bid Controller Updates (`src/modules/bid/controllers/bidController.js`)
- `placeBid()`: Emits `bid_placed` event when a new bid is created
- `updateBid()`: Emits `bid_updated` event when an existing bid is modified
- Each event includes:
  - bid_id, diamond_id, user_id, user_name
  - bid_amount (or old_amount/new_amount for updates)
  - timestamps

#### Server Changes (`server.js`)
- Switched from using `app.listen()` to `http.createServer()` 
- Initialize Socket.IO on the HTTP server
- Socket connection works on the same port as the REST API

### Frontend

#### Socket.IO Hook (`src/hooks/useBidSocket.ts`)
- Custom React hook `useBidSocket()` that:
  - Connects to the Socket.IO server with JWT authentication
  - Listens for `bid_placed` and `bid_updated` events
  - Filters events by `diamondId` if specified
  - Provides connection status (`isConnected`)
  - Auto-reconnects on disconnection

#### BidMonitoring Component (`src/pages/admin/BidMonitoring.tsx`)
- Integrated real-time updates with:
  - Live connection indicator (green dot when connected)
  - Auto-updates bid list when events arrive
  - Maintains sorting (highest bid first)
  - Updates "Highest Bid" status dynamically
- Events are handled via callbacks:
  - `onBidPlaced`: Adds new bid or updates existing user's bid
  - `onBidUpdated`: Updates bid amount and timestamp

## How It Works

### Flow for Placing a Bid

1. **User Action**: User places a bid on the frontend
2. **API Request**: POST request to `/api/user/bid`
3. **Backend Processing**: Bid is created in the database
4. **Socket Event**: `placeBid()` emits a `bid_placed` event to all admins
5. **Real-Time Update**: Admins see the new bid instantly in the BidMonitoring component

### Flow for Updating a Bid

1. **User Action**: User updates their existing bid
2. **API Request**: PUT request to `/api/user/bid/:bidId`
3. **Backend Processing**: Bid amount is updated and logged in BidHistory
4. **Socket Event**: `updateBid()` emits a `bid_updated` event to all admins
5. **Real-Time Update**: Admins see the updated bid amount instantly

## Installation

The feature was set up with:

```bash
# Backend
npm install socket.io

# Frontend
npm install socket.io-client
```

## Usage

### Admin Dashboard (Bid Monitoring)

The BidMonitoring component now:
- Automatically connects to the Socket.IO server when an admin views a specific diamond's bids
- Shows a "Live Updates" indicator in the header
- Updates the bid list in real-time
- Disconnects when the component unmounts

### Environment Variables

Ensure the following is set (or it defaults to the current frontend URL):
```
FRONTEND_URL=http://localhost:5173
```

## Key Features

✅ **Real-Time Updates**: Bids appear instantly without page refresh
✅ **Authenticated**: Only authenticated admins can receive updates
✅ **Auto-Reconnect**: Reconnects automatically if connection drops
✅ **Live Indicator**: Visual indicator shows connection status
✅ **Sorted Display**: Bids remain sorted by amount (highest first)
✅ **Dual Event Support**: Handles both new bids and bid updates

## Future Enhancements

- Add notifications/alerts for bid placed by specific users
- Broadcast bid statistics updates in real-time
- Add bid activity log with timestamps
- Send notifications to users about outbid status

## Troubleshooting

### Socket Not Connecting

1. Verify backend is running with Socket.IO: `npm run dev`
2. Check that the JWT token is valid
3. Verify CORS configuration in `src/utils/socket.js`
4. Check browser console for errors

### Events Not Received

1. Verify admin has the correct role in the database
2. Check that admin is in the `admin_bids` room (check server logs)
3. Ensure the diamondId matches between user placing bid and admin viewing

### Performance Issues

- Consider adding Redis adapter for clustering if deploying to multiple servers
- Rate limit bid emissions if necessary

## Code Files Modified

1. `/backend/server.js` - Updated to use HTTP server with Socket.IO
2. `/backend/package.json` - Added socket.io dependency
3. `/backend/src/utils/socket.js` - New Socket.IO setup file
4. `/backend/src/modules/bid/controllers/bidController.js` - Added emit calls
5. `/frontend/package.json` - Added socket.io-client dependency
6. `/frontend/src/hooks/useBidSocket.ts` - New custom hook
7. `/frontend/src/pages/admin/BidMonitoring.tsx` - Integrated real-time updates
