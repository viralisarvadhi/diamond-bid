# Testing Real-Time Bid Updates

## Setup

### Start the Backend
```bash
cd backend
npm run dev
```

The server will show:
```
✓ Socket.IO: ws://localhost:5000
```

### Start the Frontend
```bash
cd frontend
npm run dev
```

## Testing Scenarios

### Scenario 1: Admin Sees New Bids in Real-Time

1. **Open Admin Dashboard**
   - Login as admin
   - Navigate to a diamond with ACTIVE status
   - Go to the BidMonitoring page (Admin → Bids)
   - You should see a green "Live Updates" indicator

2. **Place a Bid as User**
   - In another browser/tab, login as a regular user
   - Navigate to the same diamond
   - Click "Place Bid" and enter an amount
   - Submit the bid

3. **Verify Real-Time Update**
   - Switch back to the admin tab
   - The new bid should appear instantly (without refresh)
   - The bid should be highlighted as "Highest Bid"
   - "Last Updated" timestamp should be current

### Scenario 2: Admin Sees Updated Bids in Real-Time

1. **Same Setup as Scenario 1**
   - Admin viewing bids
   - User has already placed a bid

2. **Update Bid as User**
   - As the user, update their bid to a higher amount
   - Click "Update Bid"

3. **Verify Real-Time Update**
   - Admin should see the bid amount change instantly
   - "Last Updated" timestamp updates
   - Bid remains in correct position (sorted by amount)

### Scenario 3: Multiple Users, Multiple Admins

1. **Open Multiple Admin Windows**
   - Have 2 admin browsers/tabs viewing the same diamond

2. **Place/Update Bids**
   - Users place different bids

3. **Verify All Admins Get Updates**
   - Both admin views update in real-time
   - Bid list stays in sync

### Scenario 4: Connection Status Indicator

1. **View Admin Dashboard**
   - Green dot with "Live Updates" = Connected ✅
   - Gray dot with "Connecting..." = Not connected ❌

2. **Test Reconnection**
   - If connection drops, indicator changes to gray
   - Auto-reconnects within a few seconds
   - Indicator returns to green

## Debugging

### Check Backend Logs
Look for messages like:
```
✓ User connected: [user-id] (Role: admin)
✓ Admin [user-id] joined admin_bids room
📍 Real-time bid placed: {bid_id, user_name, bid_amount}
```

### Check Frontend Console
Open browser DevTools → Console, look for:
```
✓ Socket connected
📍 Real-time bid placed: {data}
📍 Real-time bid updated: {data}
```

### Test Socket Connection Directly
In browser console:
```javascript
// This is for debugging - the hook handles this
// Just verify 'Live Updates' indicator shows in admin page
```

## Expected Behavior Checklist

- [ ] Green "Live Updates" indicator appears when admin views bid page
- [ ] New bids from users appear instantly without page refresh
- [ ] Updated bid amounts appear instantly
- [ ] Bid list stays sorted (highest bid first)
- [ ] "Highest Bid" badge updates correctly
- [ ] Timestamps update when bids change
- [ ] Multiple admins see the same updates simultaneously
- [ ] Connection indicator changes when connection drops/reconnects
- [ ] No console errors in frontend
- [ ] Backend logs show socket connections and events

## Common Issues & Solutions

### Issue: "Live Updates" shows gray "Connecting..."
**Solution**: 
- Check backend is running with `npm run dev`
- Check console for authentication errors
- Verify JWT token is valid

### Issue: Bids not updating in real-time
**Solution**:
- Refresh the page to reload initial data
- Check that user is placing bid on same diamond as admin is viewing
- Check backend console for socket emission logs

### Issue: Page shows "Unable to load bid data"
**Solution**:
- Verify admin has correct role
- Check that diamond exists and is ACTIVE
- Verify API token is valid

## Performance Tips

- If you have many admins viewing the same bid page, updates should still be instant
- Socket.IO automatically handles multiple concurrent connections
- Each bid placement/update generates exactly one socket event
