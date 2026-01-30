/**
 * 🚀 STEP 3: BIDDING API DOCUMENTATION
 * 
 * Transaction-safe bidding engine with complete audit trail
 * Every edit is logged, admin sees only newest bid per user
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🟢 USER ROUTES (Action Routes - Blocked if Deactivated)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * POST /user/bid
 * 
 * Place a new bid on a diamond
 * 
 * Authentication: Required (JWT)
 * Authorization: User role + Active account
 * 
 * Request Headers:
 * {
 *   "Authorization": "Bearer <JWT_TOKEN>"
 * }
 * 
 * Request Body:
 * {
 *   "diamond_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "bid_amount": 50000
 * }
 * 
 * Validation Rules:
 * ✓ diamond_id: required, valid UUID
 * ✓ bid_amount: required, positive number
 * ❌ user_id: NOT allowed (backend sets this)
 * ❌ timestamps: NOT allowed (backend sets this)
 * 
 * Business Rules (Enforced by Backend):
 * 1. Diamond must exist and status = ACTIVE
 * 2. Bidding time window: now >= start_time AND now <= end_time
 * 3. bid_amount >= diamond.base_price
 * 4. User can have only ONE active bid per diamond (UNIQUE constraint)
 * 5. User must be ACTIVE (is_active = true)
 * 
 * Success Response (201):
 * {
 *   "success": true,
 *   "message": "Bid placed successfully",
 *   "data": {
 *     "bid_id": "550e8400-e29b-41d4-a716-446655440001",
 *     "diamond_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "bid_amount": 50000,
 *     "created_at": "2026-01-29T10:30:00Z"
 *   }
 * }
 * 
 * Error Responses:
 * 400 - Diamond not found
 * 400 - Diamond is not accepting bids (wrong status)
 * 400 - Bidding has not started yet
 * 400 - Bidding period has ended
 * 400 - Bid amount must be at least [base_price]
 * 400 - You already have an active bid on this diamond
 * 403 - User account is deactivated
 * 401 - Invalid token
 * 500 - Server error
 */

/**
 * PUT /user/bid/:bidId
 * 
 * Update an existing bid (increase or decrease amount)
 * 
 * Authentication: Required (JWT)
 * Authorization: User role + Active account + Own bid
 * 
 * URL Params:
 * - bidId: UUID of the bid to update
 * 
 * Request Headers:
 * {
 *   "Authorization": "Bearer <JWT_TOKEN>"
 * }
 * 
 * Request Body:
 * {
 *   "bid_amount": 60000
 * }
 * 
 * Validation Rules:
 * ✓ bid_amount: required, positive number
 * ❌ diamond_id: NOT allowed
 * ❌ timestamps: NOT allowed
 * 
 * Business Rules:
 * 1. Bid must exist and belong to authenticated user
 * 2. Bidding time window: now <= end_time
 * 3. bid_amount >= diamond.base_price
 * 4. bid_amount != current_bid_amount (no point updating to same)
 * 
 * Transaction Logic:
 * Step 1: Create BidHistory entry (old_amount → new_amount)
 * Step 2: Update Bid.bid_amount
 * Step 3: Commit or rollback on error
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "message": "Bid updated successfully",
 *   "data": {
 *     "bid_id": "550e8400-e29b-41d4-a716-446655440001",
 *     "old_amount": 50000,
 *     "new_amount": 60000,
 *     "updated_at": "2026-01-29T11:00:00Z"
 *   }
 * }
 * 
 * Error Responses:
 * 400 - Bid not found
 * 403 - You can only edit your own bids
 * 400 - Bidding period has ended
 * 400 - Bid amount must be at least [base_price]
 * 400 - New bid amount is same as current bid
 * 403 - User account is deactivated
 * 401 - Invalid token
 * 500 - Server error
 */

/**
 * GET /user/bid/diamond/:diamondId
 * 
 * Get current bid for this user on a specific diamond
 * 
 * Authentication: Required (JWT)
 * Authorization: View own bid (no status check - even inactive users can view)
 * 
 * URL Params:
 * - diamondId: UUID of the diamond
 * 
 * Request Headers:
 * {
 *   "Authorization": "Bearer <JWT_TOKEN>"
 * }
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "bid_id": "550e8400-e29b-41d4-a716-446655440001",
 *     "diamond": {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "diamond_name": "Blue Diamond 5ct",
 *       "base_price": 40000,
 *       "status": "ACTIVE",
 *       "start_time": "2026-01-29T09:00:00Z",
 *       "end_time": "2026-01-29T18:00:00Z"
 *     },
 *     "bid_amount": 60000,
 *     "created_at": "2026-01-29T10:30:00Z",
 *     "updated_at": "2026-01-29T11:00:00Z"
 *   }
 * }
 * 
 * Error Responses:
 * 404 - You have not placed a bid on this diamond
 * 401 - Invalid token
 * 500 - Server error
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 👑 ADMIN ROUTES (View/Audit Routes)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * GET /admin/bids/:diamondId
 * 
 * Get all current bids for a diamond (admin view)
 * Admin sees only NEWEST bid per user (enforced by schema)
 * 
 * Authentication: Required (JWT)
 * Authorization: Admin role only
 * 
 * URL Params:
 * - diamondId: UUID of the diamond
 * 
 * Request Headers:
 * {
 *   "Authorization": "Bearer <JWT_TOKEN>"
 * }
 * 
 * Response Contents:
 * ✓ Diamond info
 * ✓ Stats: total bids, active bids (from active users), highest bid
 * ✓ All current bids sorted by amount (highest first)
 * ✓ User info for each bid (name, email, is_active status)
 * ❌ NO bid history (append-only audit table, not shown here)
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "diamond": {
 *     "id": "550e8400-e29b-41d4-a716-446655440000",
 *     "name": "Blue Diamond 5ct",
 *     "base_price": 40000,
 *     "status": "ACTIVE"
 *   },
 *   "stats": {
 *     "total_bids": 5,
 *     "active_bids": 4,
 *     "highest_bid": 85000
 *   },
 *   "bids": [
 *     {
 *       "bid_id": "550e8400-e29b-41d4-a716-446655440001",
 *       "user": {
 *         "id": "550e8400-e29b-41d4-a716-446655440010",
 *         "name": "Alice",
 *         "email": "alice@example.com",
 *         "is_active": true
 *       },
 *       "bid_amount": 85000,
 *       "created_at": "2026-01-29T10:00:00Z",
 *       "updated_at": "2026-01-29T11:30:00Z"
 *     },
 *     ... more bids sorted by amount DESC
 *   ]
 * }
 * 
 * Error Responses:
 * 404 - Diamond not found
 * 403 - Only admins can access this
 * 401 - Invalid token
 * 500 - Server error
 * 
 * KEY DESIGN: Admin sees newest bid per user only
 * This is by design - keeps dashboard clean and queries fast
 */

/**
 * GET /admin/bids/history/:bidId
 * 
 * Get complete edit history for a specific bid (admin audit trail)
 * 
 * Authentication: Required (JWT)
 * Authorization: Admin role only
 * 
 * URL Params:
 * - bidId: UUID of the bid
 * 
 * Request Headers:
 * {
 *   "Authorization": "Bearer <JWT_TOKEN>"
 * }
 * 
 * Response Contents:
 * ✓ Current bid info
 * ✓ User & diamond info
 * ✓ Complete list of all edits (from bid_history table)
 * ✓ Each edit shows: old_amount → new_amount + timestamp
 * 
 * Success Response (200):
 * {
 *   "success": true,
 *   "bid": {
 *     "bid_id": "550e8400-e29b-41d4-a716-446655440001",
 *     "user": {
 *       "id": "550e8400-e29b-41d4-a716-446655440010",
 *       "name": "Alice",
 *       "email": "alice@example.com"
 *     },
 *     "diamond": {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "diamond_name": "Blue Diamond 5ct"
 *     },
 *     "current_amount": 85000,
 *     "created_at": "2026-01-29T10:00:00Z",
 *     "updated_at": "2026-01-29T11:30:00Z"
 *   },
 *   "history": [
 *     {
 *       "history_id": "550e8400-e29b-41d4-a716-446655440100",
 *       "old_amount": 50000,
 *       "new_amount": 70000,
 *       "edited_at": "2026-01-29T10:45:00Z"
 *     },
 *     {
 *       "history_id": "550e8400-e29b-41d4-a716-446655440101",
 *       "old_amount": 70000,
 *       "new_amount": 85000,
 *       "edited_at": "2026-01-29T11:30:00Z"
 *     }
 *   ],
 *   "total_edits": 2
 * }
 * 
 * Error Responses:
 * 404 - Bid not found
 * 403 - Only admins can access this
 * 401 - Invalid token
 * 500 - Server error
 * 
 * USE CASE: Admin debugs bid disputes by viewing complete history
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📊 AUTHORIZATION & VISIBILITY MATRIX
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 *                   | User (Active) | User (Inactive) | Admin
 * ────────────────────────────────────────────────────────────
 * Place Bid          | ✓             | ✗               | ✗
 * Update Bid         | ✓             | ✗               | ✗
 * View Own Bid       | ✓             | ✓               | ✓
 * View Others' Bids  | ✗             | ✗               | ✓
 * View Bid History   | ✗             | ✗               | ✓
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

module.exports = {
  description: 'STEP 3: Bid Placement & Update Logic API Documentation',
};
