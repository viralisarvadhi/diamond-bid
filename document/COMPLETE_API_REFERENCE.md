# Diamond Bid Platform - Complete API Reference

**Base URL:** `http://localhost:5000/api`  
**Authentication:** JWT Bearer Token  
**Content-Type:** `application/json`

---

## 📋 Table of Contents

1. [Authentication APIs](#-authentication-apis)
2. [User Management APIs](#-user-management-apis-admin-only)
3. [Diamond Management APIs](#-diamond-management-apis-admin-only)
4. [Bidding APIs](#-bidding-apis)
5. [Result APIs](#-result-apis)
6. [Response Format](#-response-format)
7. [Error Handling](#-error-handling)
8. [Middleware Chain](#-middleware-chain)

---

## 🔐 Authentication APIs

### 1. User Registration

**Endpoint:** `POST /auth/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "budget": 50000
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "is_active": true,
      "budget": 50000
    }
  }
}
```

**Validation Rules:**
- Name: 2-100 characters
- Email: Valid email format (unique)
- Password: At least 8 characters
- Budget: Positive number

**Error Responses:**
- `400` - Email already registered
- `400` - Validation failed
- `500` - Server error

---

### 2. User Login

**Endpoint:** `POST /auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "is_active": true,
      "budget": 50000
    }
  }
}
```

**Error Responses:**
- `401` - Invalid email or password
- `400` - Missing email or password
- `500` - Server error

**Token Usage:**
Include in all authenticated requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 👥 User Management APIs (Admin Only)

### 1. Get All Users

**Endpoint:** `GET /admin/users`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "budget": 50000,
      "is_active": true,
      "created_at": "2026-01-30T10:00:00.000Z",
      "updated_at": "2026-01-30T10:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN",
      "budget": 0,
      "is_active": true,
      "created_at": "2026-01-30T09:00:00.000Z",
      "updated_at": "2026-01-30T09:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Token invalid or expired
- `403` - Not an admin
- `500` - Server error

---

### 2. Get Single User

**Endpoint:** `GET /admin/users/:userId`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `userId` (UUID) - User ID to fetch

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "budget": 50000,
    "is_active": true,
    "created_at": "2026-01-30T10:00:00.000Z",
    "updated_at": "2026-01-30T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - User not found
- `401` - Unauthorized
- `403` - Not an admin

---

### 3. Activate User

**Endpoint:** `PATCH /admin/users/:userId/activate`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `userId` (UUID) - User ID to activate

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "is_active": true
  }
}
```

**Error Responses:**
- `404` - User not found
- `401` - Unauthorized
- `403` - Not an admin

---

### 4. Deactivate User

**Endpoint:** `PATCH /admin/users/:userId/deactivate`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `userId` (UUID) - User ID to deactivate

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "is_active": false
  }
}
```

**Notes:**
- Deactivated users can VIEW diamonds and bids but CANNOT place new bids
- Deactivation is reversible via activate endpoint

---

## 💎 Diamond Management APIs (Admin Only)

### 1. Create Diamond

**Endpoint:** `POST /admin/diamonds`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**Request Body:**
```json
{
  "diamond_name": "Royal Blue Diamond",
  "base_price": 50000,
  "bid_start_time": "2026-01-30T12:00:00Z",
  "bid_end_time": "2026-01-30T13:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Diamond created successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "diamond_name": "Royal Blue Diamond",
    "base_price": "50000.00",
    "status": "DRAFT",
    "start_time": "2026-01-30T12:00:00.000Z",
    "end_time": "2026-01-30T13:00:00.000Z",
    "created_at": "2026-01-30T11:00:00.000Z",
    "updated_at": "2026-01-30T11:00:00.000Z"
  }
}
```

**Validation Rules:**
- Diamond name: 2-255 characters (unique)
- Base price: > 0
- Start time: Must be before end time
- Times: Must be in future (for automatic activation)

**Status Lifecycle:**
```
DRAFT → (Auto) → ACTIVE → (Auto) → CLOSED → (Admin) → SOLD
```

**Error Responses:**
- `400` - Invalid data
- `401` - Unauthorized
- `403` - Not an admin
- `409` - Diamond name already exists

---

### 2. Get All Diamonds (Admin)

**Endpoint:** `GET /admin/diamonds`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "diamond_name": "Royal Blue Diamond",
      "base_price": "50000.00",
      "status": "ACTIVE",
      "start_time": "2026-01-30T12:00:00.000Z",
      "end_time": "2026-01-30T13:00:00.000Z",
      "created_at": "2026-01-30T11:00:00.000Z",
      "updated_at": "2026-01-30T11:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Single Diamond (Admin)

**Endpoint:** `GET /admin/diamonds/:diamondId`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "diamond_name": "Royal Blue Diamond",
    "base_price": "50000.00",
    "status": "ACTIVE",
    "start_time": "2026-01-30T12:00:00.000Z",
    "end_time": "2026-01-30T13:00:00.000Z",
    "created_at": "2026-01-30T11:00:00.000Z",
    "updated_at": "2026-01-30T11:30:00.000Z"
  }
}
```

---

### 4. Edit Diamond (DRAFT Only)

**Endpoint:** `PATCH /admin/diamonds/:diamondId/edit`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Request Body:**
```json
{
  "diamond_name": "Updated Diamond Name",
  "base_price": 60000
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Diamond updated successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "diamond_name": "Updated Diamond Name",
    "base_price": "60000.00",
    "status": "DRAFT"
  }
}
```

**Restrictions:**
- Only DRAFT diamonds can be edited
- Cannot edit ACTIVE, CLOSED, or SOLD diamonds

**Error Responses:**
- `400` - Cannot edit non-DRAFT diamond
- `404` - Diamond not found

---

### 5. Reschedule Diamond (CLOSED Only)

**Endpoint:** `PATCH /admin/diamonds/:diamondId/reschedule`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Request Body:**
```json
{
  "bid_start_time": "2026-01-31T14:00:00Z",
  "bid_end_time": "2026-01-31T15:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Diamond rescheduled successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "DRAFT",
    "start_time": "2026-01-31T14:00:00.000Z",
    "end_time": "2026-01-31T15:00:00.000Z"
  }
}
```

**Restrictions:**
- Only CLOSED diamonds can be rescheduled
- Rescheduled diamond returns to DRAFT status

---

### 6. Delete Diamond (DRAFT or CLOSED)

**Endpoint:** `DELETE /admin/diamonds/:diamondId`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Diamond deleted successfully"
}
```

**Restrictions:**
- Only DRAFT or CLOSED diamonds can be deleted
- Soft delete (data preserved in database)
- All related bids are cascade deleted

---

### 7. Activate Diamond (Manual)

**Endpoint:** `PATCH /admin/diamonds/:diamondId/activate`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Diamond activated successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "ACTIVE"
  }
}
```

**Note:** Automatic activation via scheduler runs every 60 seconds

---

### 8. Close Diamond (Manual)

**Endpoint:** `PATCH /admin/diamonds/:diamondId/close`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Diamond closed successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "CLOSED"
  }
}
```

**Note:** Automatic closing via scheduler runs every 60 seconds

---

### 9. Get Available Diamonds (User)

**Endpoint:** `GET /user/diamonds`

**Authentication:** Required (JWT)  
**Authorization:** Any authenticated user

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "diamond_name": "Royal Blue Diamond",
      "base_price": "50000.00",
      "status": "ACTIVE",
      "start_time": "2026-01-30T12:00:00.000Z",
      "end_time": "2026-01-30T13:00:00.000Z",
      "user_bid": {
        "bid_amount": "55000.00"
      }
    }
  ]
}
```

**Note:** Only returns ACTIVE diamonds

---

### 10. Get Diamond Details (User)

**Endpoint:** `GET /user/diamonds/:diamondId`

**Authentication:** Required (JWT)  
**Authorization:** Any authenticated user

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "diamond_name": "Royal Blue Diamond",
    "base_price": "50000.00",
    "status": "ACTIVE",
    "start_time": "2026-01-30T12:00:00.000Z",
    "end_time": "2026-01-30T13:00:00.000Z",
    "user_bid": {
      "bid_amount": "55000.00",
      "is_winner": false
    }
  }
}
```

---

## 🏆 Bidding APIs

### 1. Place Bid

**Endpoint:** `POST /user/bid`

**Authentication:** Required (JWT)  
**Authorization:** Active users only  
**Middleware Chain:** authenticate → isActiveUser → isUser → validate

**Request Body:**
```json
{
  "diamond_id": "770e8400-e29b-41d4-a716-446655440002",
  "bid_amount": 55000
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Bid placed successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "diamond_id": "770e8400-e29b-41d4-a716-446655440002",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "bid_amount": "55000.00",
    "created_at": "2026-01-30T12:30:00.000Z",
    "updated_at": "2026-01-30T12:30:00.000Z"
  }
}
```

**Validation Rules:**
- Bid amount: > base_price OR > current_highest_bid
- Diamond: Must be ACTIVE
- User: Must be active (is_active = true)
- Only one bid per user per diamond (new bid creates history)

**Business Rules:**
- Bid amount must be strictly greater than current highest
- If user already bid, updates their bid (creates history record)
- Diamond status checked: must be ACTIVE

**Error Responses:**
- `400` - Bid amount too low
- `400` - Diamond not active
- `401` - User deactivated
- `404` - Diamond not found
- `409` - Invalid bid amount
- `500` - Server error

**Real-time:** Socket event emitted to all users in `diamond_{diamondId}` room

---

### 2. Update Bid

**Endpoint:** `PUT /user/bid/:bidId`

**Authentication:** Required (JWT)  
**Authorization:** Active users only  
**Middleware Chain:** authenticate → isActiveUser → isUser → validate

**URL Parameters:**
- `bidId` (UUID) - Bid ID to update

**Request Body:**
```json
{
  "bid_amount": 60000
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bid updated successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "diamond_id": "770e8400-e29b-41d4-a716-446655440002",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "bid_amount": "60000.00",
    "created_at": "2026-01-30T12:30:00.000Z",
    "updated_at": "2026-01-30T12:35:00.000Z"
  }
}
```

**Bid History:**
- Creates entry in `bid_histories` table
- Tracks: old_amount → new_amount
- Timestamp: edited_at

**Error Responses:**
- `400` - Bid amount too low
- `401` - Not bid owner
- `404` - Bid not found

**Real-time:** Socket event emitted to room

---

### 3. Get User's Bid

**Endpoint:** `GET /user/bid/diamond/:diamondId`

**Authentication:** Required (JWT)  
**Authorization:** Any authenticated user  
**Middleware Chain:** authenticate

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "diamond_id": "770e8400-e29b-41d4-a716-446655440002",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "bid_amount": "60000.00",
    "created_at": "2026-01-30T12:30:00.000Z",
    "updated_at": "2026-01-30T12:35:00.000Z"
  }
}
```

**Error Responses:**
- `404` - You have not placed a bid on this diamond
- `401` - Invalid token

---

### 4. Get All Bids for Diamond (Admin)

**Endpoint:** `GET /admin/bids/:diamondId`

**Authentication:** Required (JWT)  
**Authorization:** Admin only  
**Middleware Chain:** authenticate → isAdmin

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "diamond_id": "770e8400-e29b-41d4-a716-446655440002",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_name": "John Doe",
      "bid_amount": "60000.00",
      "created_at": "2026-01-30T12:30:00.000Z",
      "updated_at": "2026-01-30T12:35:00.000Z"
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "diamond_id": "770e8400-e29b-41d4-a716-446655440002",
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "user_name": "Jane Smith",
      "bid_amount": "58000.00",
      "created_at": "2026-01-30T12:25:00.000Z",
      "updated_at": "2026-01-30T12:25:00.000Z"
    }
  ]
}
```

**Notes:**
- Returns only NEWEST bid per user (one bid per user per diamond)
- Sorted by bid_amount DESC (highest first)

---

### 5. Get Bid History (Admin)

**Endpoint:** `GET /admin/bids/history/:bidId`

**Authentication:** Required (JWT)  
**Authorization:** Admin only  
**Middleware Chain:** authenticate → isAdmin

**URL Parameters:**
- `bidId` (UUID) - Bid ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "bid_id": "880e8400-e29b-41d4-a716-446655440003",
      "old_amount": null,
      "new_amount": "55000.00",
      "edited_at": "2026-01-30T12:30:00.000Z"
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "bid_id": "880e8400-e29b-41d4-a716-446655440003",
      "old_amount": "55000.00",
      "new_amount": "60000.00",
      "edited_at": "2026-01-30T12:35:00.000Z"
    }
  ]
}
```

**Purpose:**
- Audit trail for bid changes
- Prevents bid manipulation
- Sorted by edited_at ASC (oldest first)

---

## 🥇 Result APIs

### 1. Declare Result (Admin)

**Endpoint:** `POST /admin/results/:diamondId`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Request Body:** (Empty - system determines winner)
```json
{}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Result declared successfully",
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "diamond_id": "770e8400-e29b-41d4-a716-446655440002",
    "winner_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "winning_bid_amount": "60000.00",
    "declared_at": "2026-01-30T13:00:00.000Z"
  }
}
```

**Tie-Breaking Logic:**
1. Highest bid amount wins
2. If tied: Earliest bid (created_at) wins
3. Deterministic: Backend-controlled, no user manipulation

**Automatic Actions:**
- Creates Result record
- Updates Diamond status: CLOSED → SOLD
- Emits Socket event to all clients

**Error Responses:**
- `400` - No bids placed on this diamond
- `400` - Diamond not CLOSED
- `404` - Diamond not found
- `409` - Result already declared

**Real-time:** Socket event `result_declared` emitted to `diamond_{diamondId}` room

---

### 2. Get Result (Admin)

**Endpoint:** `GET /admin/results/:diamondId`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "diamond_id": "770e8400-e29b-41d4-a716-446655440002",
    "winner_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "winner_name": "John Doe",
    "winner_email": "john@example.com",
    "winning_bid_amount": "60000.00",
    "declared_at": "2026-01-30T13:00:00.000Z"
  }
}
```

**Includes:**
- Winner user details (name, email)
- Winning bid amount
- Declaration timestamp

---

### 3. Get All Results (Admin)

**Endpoint:** `GET /admin/results`

**Authentication:** Required (JWT)  
**Authorization:** Admin only

**Query Parameters (Optional):**
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "diamond_id": "770e8400-e29b-41d4-a716-446655440002",
      "diamond_name": "Royal Blue Diamond",
      "winner_user_id": "550e8400-e29b-41d4-a716-446655440000",
      "winner_name": "John Doe",
      "winning_bid_amount": "60000.00",
      "declared_at": "2026-01-30T13:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Sorting:** By declared_at DESC (newest first)

---

### 4. Get Result (User View)

**Endpoint:** `GET /user/results/diamond/:diamondId`

**Authentication:** Required (JWT)  
**Authorization:** Any authenticated user

**URL Parameters:**
- `diamondId` (UUID) - Diamond ID

**Response - Before Declaration (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "PENDING",
    "message": "Result will be declared soon"
  }
}
```

**Response - User Won (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "DECLARED",
    "result": "WON",
    "winning_amount": "60000.00",
    "message": "You won this bid!"
  }
}
```

**Response - User Lost (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "DECLARED",
    "result": "LOST",
    "message": "You lost this bid"
  }
}
```

**Response - Did Not Participate (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "DECLARED",
    "result": "NO_PARTICIPATION",
    "message": "You did not participate in this bid"
  }
}
```

**Visibility Rules (Security):**
- ✅ Winners see: "You won" + amount
- ✅ Losers see: "You lost" (NO winner details)
- ✅ Non-participants see: "Did not participate"
- ✅ Before declaration: "Result pending"

---

## 📄 Response Format

### Success Response

```json
{
  "success": true,
  "message": "Optional message",
  "data": {
    // Response payload
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional details"
  }
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | Success | Fetched data successfully |
| `201` | Created | Resource created |
| `400` | Bad Request | Invalid data/validation failed |
| `401` | Unauthorized | Missing/invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Business rule violation |
| `500` | Server Error | Internal error |

### Common Error Messages

```json
{
  "success": false,
  "message": "Invalid token",
  "error": { "code": "UNAUTHORIZED" }
}
```

```json
{
  "success": false,
  "message": "Only admins can access this resource",
  "error": { "code": "FORBIDDEN" }
}
```

```json
{
  "success": false,
  "message": "Bid amount must be greater than current highest bid",
  "error": { "code": "INVALID_BID" }
}
```

---

## 🔗 Middleware Chain

### Authentication
```
Every Protected Route
    ↓
authenticate middleware
    ↓
Verify JWT token
    ↓
Extract user info (id, role, is_active)
    ↓
Continue if valid
```

### Role Authorization
```
Admin Routes:
    ↓
authenticate
    ↓
isAdmin middleware
    ↓
Check role == 'ADMIN'
    ↓
403 if not admin
```

```
User Routes:
    ↓
authenticate
    ↓
isUser middleware
    ↓
Check role == 'USER'
    ↓
403 if not user
```

### Active User Check
```
Bid Placement Routes:
    ↓
authenticate
    ↓
isActiveUser middleware
    ↓
Check is_active == true
    ↓
Reject if deactivated
```

### Validation
```
All POST/PUT Routes:
    ↓
authenticate
    ↓
(role checks)
    ↓
validate middleware
    ↓
Joi schema validation
    ↓
400 if invalid
```

---

## 🔐 Token Structure

JWT token contains:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "role": "USER",
  "iat": 1706592000,
  "exp": 1707197200
}
```

**Token Expiry:** 7 days from generation

**Configuration:**
- Set via environment variable: `JWT_EXPIRY`
- Default: `'7d'` (can be `'24h'`, `'1440m'`, etc.)
- Location: `backend/src/utils/jwt.utils.js`

---

## 📡 Real-Time Socket Events

### Client → Server
```javascript
socket.emit('join_diamond', diamondId)
socket.emit('leave_diamond', diamondId)
```

### Server → Clients (Broadcast to room)
```javascript
// When bid placed
emit('bid_placed', { diamondId, bidderId, bid_amount, bid_time })

// Active users count
emit('active_users_update', { diamondId, activeUsersCount })

// Result declared
emit('result_declared', { diamondId, winner_user_id, winning_amount })

// Diamond status changed
emit('diamond_status_changed', { diamondId, status })
```

---

## 🧪 Quick Test Examples

### Register User (curl)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "budget": 50000
  }'
```

### Login (curl)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Create Diamond (curl)
```bash
curl -X POST http://localhost:5000/api/admin/diamonds \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "diamond_name": "Royal Blue",
    "base_price": 50000,
    "bid_start_time": "2026-01-30T12:00:00Z",
    "bid_end_time": "2026-01-30T13:00:00Z"
  }'
```

### Place Bid (curl)
```bash
curl -X POST http://localhost:5000/api/user/bid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "diamond_id": "DIAMOND_UUID",
    "bid_amount": 55000
  }'
```

---

## 📚 API Summary Table

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| POST | /auth/register | ✗ | - | Register new user |
| POST | /auth/login | ✗ | - | Login user |
| GET | /admin/users | ✓ | ADMIN | Get all users |
| GET | /admin/users/:id | ✓ | ADMIN | Get single user |
| PATCH | /admin/users/:id/activate | ✓ | ADMIN | Activate user |
| PATCH | /admin/users/:id/deactivate | ✓ | ADMIN | Deactivate user |
| POST | /admin/diamonds | ✓ | ADMIN | Create diamond |
| GET | /admin/diamonds | ✓ | ADMIN | Get all diamonds |
| GET | /admin/diamonds/:id | ✓ | ADMIN | Get single diamond |
| PATCH | /admin/diamonds/:id/edit | ✓ | ADMIN | Edit diamond |
| PATCH | /admin/diamonds/:id/reschedule | ✓ | ADMIN | Reschedule diamond |
| DELETE | /admin/diamonds/:id | ✓ | ADMIN | Delete diamond |
| PATCH | /admin/diamonds/:id/activate | ✓ | ADMIN | Activate diamond |
| PATCH | /admin/diamonds/:id/close | ✓ | ADMIN | Close diamond |
| GET | /user/diamonds | ✓ | - | Get available diamonds |
| GET | /user/diamonds/:id | ✓ | - | Get diamond details |
| POST | /user/bid | ✓ | USER | Place bid |
| PUT | /user/bid/:id | ✓ | USER | Update bid |
| GET | /user/bid/diamond/:id | ✓ | - | Get user's bid |
| GET | /admin/bids/:diamondId | ✓ | ADMIN | Get all bids |
| GET | /admin/bids/history/:bidId | ✓ | ADMIN | Get bid history |
| POST | /admin/results/:diamondId | ✓ | ADMIN | Declare result |
| GET | /admin/results/:diamondId | ✓ | ADMIN | Get result (admin) |
| GET | /admin/results | ✓ | ADMIN | Get all results |
| GET | /user/results/diamond/:id | ✓ | - | Get result (user) |

---

## 🚀 Getting Started

1. **Register a user**: `POST /auth/register`
2. **Login**: `POST /auth/login` → Get token
3. **Create a diamond** (as ADMIN): `POST /admin/diamonds`
4. **View diamonds** (as USER): `GET /user/diamonds`
5. **Place a bid** (as USER): `POST /user/bid`
6. **Declare winner** (as ADMIN): `POST /admin/results/:diamondId`

---

## 📖 For More Information

- Full system architecture: See `COMPLETE_ARCHITECTURE.md`
- Database schema: See `DATABASE_SCHEMA_AND_RELATIONS.md`
- Socket.IO events: See backend `/src/utils/socket.js`

