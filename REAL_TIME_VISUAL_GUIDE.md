# Real-Time Bid Updates - Visual Guide

## 🎬 User Flow Diagram

```
┌─────────────┐
│   ADMIN     │
│  Dashboard  │
│ (Browser 1) │
└──────┬──────┘
       │
       │ Views bid page for Diamond X
       │
       ├──> Socket.IO connects
       ├──> Joins 'admin_bids' room
       └──> Shows "Live Updates" indicator ✓

┌─────────────────────────────────────┐
│     Backend Socket.IO Server        │
│    (admin_bids room active)         │
└──────────────────┬──────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
 USER PLACES BID           ADMIN SEES BID
 (Browser 2)               (Browser 1)
   │                           │
   ├─ POST /api/user/bid       │
   │                           │
   ├─ Bid created in DB        │
   │                           │
   ├─ placeBid() emits ────────┼──> bid_placed event
   │   bid_placed              │
   │                           │
   │                           ├─ Socket receives
   │                           │
   │                           ├─ onBidPlaced callback
   │                           │
   │                           ├─ Update state
   │                           │
   │                           └─ Re-render ✓
   │
   └─ Response to user
```

## 📊 Real-Time Update Architecture

```
FRONTEND                    BACKEND
┌────────────────────────┐  ┌────────────────────────┐
│   Browser (Admin)      │  │   Node.js Server       │
│                        │  │                        │
│  BidMonitoring        │  │  Socket.IO Server      │
│  Component            │  │                        │
│  ├─ useBidSocket hook │◄─┼─ JWT Auth check       │
│  ├─ Connect with JWT  │──┼─→ Verify token        │
│  ├─ Join admin_bids   │  │                        │
│  │                    │  │  Bid Controller        │
│  │                    │  │  ├─ placeBid()        │
│  │                    │  │  ├─ updateBid()       │
│  │                    │  │  └─ emit to room      │
│  │                    │  │                        │
│  │ Listen for:        │  │  Database             │
│  │ - bid_placed  ◄────┼──┼─ Bids table          │
│  │ - bid_updated ◄────┼──┼─ BidHistory table    │
│  │                    │  │                        │
│  │ Update State:      │  │                        │
│  │ └─ Re-render       │  │                        │
│  │   Display new bid  │  │                        │
│                        │  │                        │
└────────────────────────┘  └────────────────────────┘
```

## 🔄 Event Flow for Placing a Bid

```
1. USER PLACES BID
   ↓
   User clicks "Place Bid" button
   ↓
   
2. API REQUEST
   ↓
   POST /api/user/bid
   Body: { diamond_id: "xxx", bid_amount: 5000 }
   Headers: { Authorization: "Bearer token" }
   ↓
   
3. BACKEND PROCESSING
   ↓
   ├─ Validate request (active user, amount ≥ base price)
   ├─ Check time window (bidding period active)
   ├─ Check unique constraint (one bid per user per diamond)
   ├─ Create bid in database
   └─ Transaction committed
   ↓
   
4. SOCKET EMISSION
   ↓
   emitBidUpdate({
       event: 'bid_placed',
       bid_id: "abc123",
       diamond_id: "xxx",
       user_id: "user123",
       user_name: "John Doe",
       bid_amount: 5000,
       created_at: "2026-01-29T10:30:00Z"
   })
   ↓
   Broadcast to 'admin_bids' room
   ↓
   
5. FRONTEND RECEIVES EVENT
   ↓
   useBidSocket hook catches 'bid_placed' event
   ↓
   Calls onBidPlaced callback with data
   ↓
   
6. COMPONENT UPDATE
   ↓
   BidMonitoring component receives callback
   ↓
   Updates state:
   ├─ Add bid to list (if new user)
   ├─ Sort bids by amount (highest first)
   ├─ Update highest_bid_user_id
   └─ Re-render component
   ↓
   
7. ADMIN SEES UPDATE
   ↓
   New bid appears in table instantly! ✓
```

## 💾 Data Flow for Updating a Bid

```
USER UPDATES BID
    ↓
PUT /api/user/bid/:bidId
Body: { bid_amount: 6500 }
    ↓
BACKEND:
1. Find existing bid
2. Create history entry (old: 5000, new: 6500)
3. Update bid amount to 6500
4. Commit transaction
    ↓
EMIT: bid_updated event
{
    event: 'bid_updated',
    bid_id: "abc123",
    diamond_id: "xxx",
    user_id: "user123",
    user_name: "John Doe",
    old_amount: 5000,
    new_amount: 6500,
    updated_at: "2026-01-29T10:35:00Z"
}
    ↓
FRONTEND:
onBidUpdated callback updates state:
├─ Find bid by user_id
├─ Update bid_amount to 6500
├─ Update timestamp
├─ Re-sort bids
└─ Re-render
    ↓
ADMIN SEES:
Old bid (5000) → New bid (6500) 
Timestamp updated
Position possibly changes
✓ Instant update!
```

## 🔐 Authentication Flow

```
ADMIN CONNECTS TO SOCKET.IO
        ↓
Frontend stores JWT token in Redux:
token = "eyJhbGc..."
        ↓
useBidSocket hook extracts token
        ↓
Connect to Socket.IO with auth:
io(url, {
    auth: { token: "eyJhbGc..." }
})
        ↓
BACKEND RECEIVES CONNECTION
        ↓
io.use((socket, next) => {
    const token = socket.handshake.auth.token
    jwt.verify(token, SECRET)
    socket.userId = decoded.id
    socket.userRole = decoded.role
    next()
})
        ↓
VERIFY ROLE
        ↓
if (userRole === 'admin') {
    socket.join('admin_bids')
    ✓ Connected and authorized!
}
        ↓
ONLY ADMINS GET REAL-TIME UPDATES
```

## ⏱️ Connection Lifecycle

```
ADMIN VISITS BID PAGE
        ↓
componentDidMount
        ↓
useBidSocket hook called
        ↓
Socket connects with JWT
        ↓
socket.on('connect', () => {
    setIsConnected(true)
    Show green "Live Updates" indicator
})
        ↓
WAITING FOR BID EVENTS
        ↓
socket.on('bid_placed', (data) => {
    if (!diamondId || data.diamond_id === diamondId) {
        onBidPlaced?.(data)
    }
})
        ↓
socket.on('bid_updated', (data) => {
    if (!diamondId || data.diamond_id === diamondId) {
        onBidUpdated?.(data)
    }
})
        ↓
ADMIN LEAVES PAGE
        ↓
componentWillUnmount
        ↓
disconnect()
        ↓
socket.disconnect()
        ↓
socket.on('disconnect', () => {
    setIsConnected(false)
    Show gray "Connecting..." indicator
})
```

## 📱 UI Components

### Admin Dashboard - Live Indicator

```
┌─────────────────────────────────────┐
│ Diamond Name                        │
│ ─────────────────────────────────── │
│                                     │
│ [●] Live Updates    [ACTIVE]        │
│   Green dot = Connected             │
│   Gray dot = Reconnecting           │
│                                     │
│ Base Price: $5,000                  │
│ Bid End Time: 2026-01-29 12:00 PM   │
└─────────────────────────────────────┘
```

### Bid Table - Real-Time Updates

```
┌────────────┬─────────┬──────────────┬──────────────┐
│ User Name  │ Amount  │ Last Updated │ Status       │
├────────────┼─────────┼──────────────┼──────────────┤
│ John Doe   │ $6,500  │ Just now     │ Highest Bid  │◄── Real-time
│ Jane Smith │ $5,500  │ 5 min ago    │              │
│ Bob Jones  │ $4,000  │ 10 min ago   │              │
└────────────┴─────────┴──────────────┴──────────────┘
```

## 🎯 Key Integration Points

1. **Backend Socket.IO** → `src/utils/socket.js`
2. **Bid Events** → `src/modules/bid/controllers/bidController.js`
3. **Frontend Hook** → `src/hooks/useBidSocket.ts`
4. **Admin Component** → `src/pages/admin/BidMonitoring.tsx`

## ✨ Performance Notes

- WebSocket is faster than polling (instant vs every N seconds)
- Minimal bandwidth (only events, not full page refresh)
- Scales well (Socket.IO handles thousands of concurrent connections)
- No database impact (same bids, just broadcasted via socket)

## 🔄 Reconnection Strategy

```
Connection Lost
        ↓
Socket.io detects disconnection (2-3 seconds)
        ↓
Auto-reconnect starts:
├─ Attempt 1: 1 second delay
├─ Attempt 2: 1 second delay
├─ Attempt 3: 2 seconds delay
├─ Attempt 4: 3 seconds delay
└─ Attempt 5: 5 seconds delay
        ↓
If reconnected:
├─ setIsConnected(true)
├─ Show green indicator
└─ Resume listening for events
        ↓
If max attempts exceeded:
├─ Stop retrying
├─ Show gray indicator
└─ Admin needs to refresh
```
