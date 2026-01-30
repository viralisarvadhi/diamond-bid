# Diamond Bid Platform - Complete Architecture & Workflow

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [System Workflow](#system-workflow)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Database Schema](#database-schema)
8. [Real-Time Features](#real-time-features)
9. [API Endpoints](#api-endpoints)
10. [Setup & Run](#setup--run)

---

## 🎯 Project Overview

**Diamond Bid** is a real-time auction platform where:
- **Users** can browse diamonds and place bids
- **Admins** can create diamonds, manage auctions, and declare winners
- **Real-time updates** show active bidders, live bids, and user counts
- **Automatic scheduling** activates/closes auctions on set times
- **Winner determination** based on highest bid with tie-breaking logic

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18+** | UI library & component framework |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build tool & dev server (ultra-fast) |
| **Redux Toolkit** | State management (auth, user data) |
| **React Router v6** | Client-side routing & navigation |
| **Socket.IO Client** | Real-time WebSocket communication |
| **Tailwind CSS** | Utility-first CSS styling |
| **Axios** | HTTP client for API calls |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | Server runtime & web framework |
| **PostgreSQL** | Relational database |
| **Sequelize** | ORM (Object-Relational Mapping) |
| **Socket.IO** | Real-time bidirectional communication |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **Bcryptjs** | Password hashing & security |
| **Node Cron** | Scheduled jobs (auto-activation/closing) |

### Development Tools
| Tool | Purpose |
|-----|---------|
| **ESLint** | Code quality & linting |
| **PostCSS** | CSS processing |
| **npm** | Package manager |

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DIAMOND BID PLATFORM                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │   BROWSER/APP   │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐
            │   HTTP Req   │  │  Socket Events  │  │  Local State │
            │  (REST API)  │  │  (Real-time)    │  │  (Redux)     │
            └──────┬───────┘  └────────┬────────┘  └──────────────┘
                   │                   │
                   └───────────┬───────┘
                               │
                ┌──────────────▼──────────────┐
                │    FIREWALL / CORS          │
                └──────────────┬──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
   ┌─────────────┐      ┌─────────────┐      ┌──────────────┐
   │  Auth Route │      │ Diamond API │      │  Bid Route   │
   │ (Login/Reg) │      │ (CRUD + Ops)│      │ (Place/View) │
   └──────┬──────┘      └──────┬──────┘      └──────┬───────┘
          │                    │                    │
          │    ┌───────────────┼───────────────┐   │
          │    │               │               │   │
          │    ▼               ▼               ▼   │
          └───▶┌─────────────────────────────────┐◀┘
               │   EXPRESS SERVER (PORT 5000)    │
               │                                 │
               │  ┌─────────────────────────────┐│
               │  │   Auth Controller           ││
               │  │   - Login                   ││
               │  │   - Register                ││
               │  │   - JWT Verification       ││
               │  └─────────────────────────────┘│
               │  ┌─────────────────────────────┐│
               │  │   Diamond Controller        ││
               │  │   - Create                  ││
               │  │   - Fetch                   ││
               │  │   - Update Status           ││
               │  │   - Reschedule              ││
               │  └─────────────────────────────┘│
               │  ┌─────────────────────────────┐│
               │  │   Bid Controller            ││
               │  │   - Place Bid               ││
               │  │   - Get Bids                ││
               │  │   - Update Bid              ││
               │  └─────────────────────────────┘│
               │  ┌─────────────────────────────┐│
               │  │   Socket.IO Manager         ││
               │  │   - Join Room (diamond_id)  ││
               │  │   - Leave Room              ││
               │  │   - Emit Updates            ││
               │  └─────────────────────────────┘│
               │  ┌─────────────────────────────┐│
               │  │   Diamond Scheduler         ││
               │  │   - Auto-Activate (60s)     ││
               │  │   - Auto-Close (60s)        ││
               │  │   - Check start_time/end    ││
               │  └─────────────────────────────┘│
               └─────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
        ┌──────────────────┐       ┌─────────────────────┐
        │   PostgreSQL DB  │       │  Socket.IO Rooms    │
        │  (Persistence)   │       │  (Real-time Sync)   │
        │                  │       │                     │
        │ ┌──────────────┐ │       │ diamond_123 room    │
        │ │ users table  │ │       │ diamond_456 room    │
        │ ├──────────────┤ │       │ ...                 │
        │ │diamonds table│ │       └─────────────────────┘
        │ ├──────────────┤ │
        │ │ bids table   │ │
        │ ├──────────────┤ │
        │ │result table  │ │
        │ └──────────────┘ │
        └──────────────────┘
```

---

## 🔄 System Workflow

### 1. User Registration & Login Flow

```
┌─────────┐
│  START  │
└────┬────┘
     │
     ▼
┌──────────────────────────┐
│ User enters email/password│
└────┬─────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Frontend: POST /auth/register     │
│ Body: {name, email, password}     │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│ Backend: Hash password + Store in DB     │
│ - bcryptjs.hash(password, 10)            │
│ - Create user record in PostgreSQL       │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│ Generate JWT Token                       │
│ Payload: {id, name, email, role, ...}    │
│ Secret: process.env.JWT_SECRET           │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│ Response: {token, user: {...}}           │
│ Frontend: Store token in localStorage    │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│ Frontend: Redux loginSuccess action      │
│ - Decode JWT payload                     │
│ - Extract user data                      │
│ - Update auth state                      │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│ Redirect to Dashboard                    │
│ (Admin or User based on role)             │
└──────────────────────────────────────────┘
```

### 2. Diamond Creation & Scheduling

```
┌─────────────────────────────┐
│ Admin: Create Diamond Form  │
│ - Name, Base Price          │
│ - Start Time                │
│ - End Time                  │
└────┬────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Frontend: POST /diamonds/create          │
│ Body: {name, basePrice, startTime, ...}  │
│ Header: Authorization: Bearer {token}    │
└────┬─────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│ Backend: Store in DB                   │
│ - Status: DRAFT (initial)              │
│ - start_time: 2026-01-30 12:30:00      │
│ - end_time: 2026-01-30 13:30:00        │
└────┬───────────────────────────────────┘
     │
     ▼
┌───────────────────────────────────────┐
│ Backend: Node Cron runs every 60 sec  │
│ - Check DRAFT diamonds where          │
│   start_time <= NOW                   │
│ - Update status: DRAFT → ACTIVE       │
│ - Emit socket event: diamond_updated  │
└────┬──────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────┐
│ Socket.IO: Broadcast to all clients│
│ emit('diamond_status_changed', {   │
│   diamondId, status: 'ACTIVE'      │
│ })                                 │
└────┬───────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Frontend: Updates UI in real-time    │
│ - Diamond appears as ACTIVE         │
│ - Bidding interface becomes enabled │
└──────────────────────────────────────┘
```

### 3. Real-Time Bidding Flow

```
┌────────────────────────────┐
│ User opens BidPage         │
│ (diamondId route param)    │
└────┬───────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ useBidSocket Hook:                   │
│ - Connect to Socket.IO server        │
│ - Emit: join_diamond(diamondId)      │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Backend Socket Handler:              │
│ - Add client to room: diamond_{id}   │
│ - Count active users in room         │
│ - Broadcast: active_users_update     │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ All clients in room receive:          │
│ active_users_count: 3                 │
│ Display live indicator with count     │
└────┬─────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────┐
│ User enters bid amount & submits    │
│ Frontend: POST /bids/place          │
│ Body: {                             │
│   diamondId,                        │
│   bid_amount                        │
│ }                                   │
└────┬───────────────────────────────┘
     │
     ▼
┌───────────────────────────────────────┐
│ Backend: Validate bid                 │
│ - Check user is active                │
│ - Check bid > current highest         │
│ - Create Bid record in DB             │
│ - Update BidHistory                   │
└────┬──────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Socket.IO: Emit to room               │
│ emit('bid_placed', {                  │
│   diamondId,                          │
│   bidderId,                           │
│   bid_amount,                         │
│   bid_time                            │
│ })                                    │
└────┬─────────────────────────────────┘
     │
     ▼
┌───────────────────────────────────────┐
│ All clients in room:                  │
│ - Receive new bid update              │
│ - Update bids table                   │
│ - Refresh highest bid display         │
└───────────────────────────────────────┘
```

### 4. Winner Declaration Flow

```
┌────────────────────────────────┐
│ Diamond end_time passes        │
│ (Cron checks every 60 seconds) │
└────┬───────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Backend Cron:                    │
│ - Find ACTIVE diamonds           │
│ - Where end_time <= NOW          │
│ - Update status: ACTIVE → CLOSED │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Admin views BidMonitoring page   │
│ Clicks "Declare Winner"          │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Frontend: POST /results/declare  │
│ Body: {diamondId}                │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Backend Logic:                       │
│ 1. Get all bids for diamond          │
│ 2. Find highest bid                  │
│ 3. Handle tie-breaking (earliest)    │
│ 4. Create Result record              │
│ 5. Update diamond status: SOLD       │
└────┬───────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Socket.IO: Broadcast to all clients  │
│ emit('result_declared', {            │
│   diamondId,                         │
│   winner_user_id,                    │
│   winning_bid_amount,                │
│   status: 'SOLD'                     │
│ })                                   │
└────┬───────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ All clients:                         │
│ - Show winner banner                 │
│ - Display winner details             │
│ - Diamond marked as SOLD             │
│ - Bidding disabled                   │
└──────────────────────────────────────┘
```

---

## 🎨 Frontend Architecture

### Directory Structure
```
frontend/
├── src/
│   ├── app/                    # Redux store setup
│   │   ├── hooks.ts            # useAppSelector, useAppDispatch
│   │   └── store.ts            # Store configuration
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   └── LogoutButton.tsx
│   │   └── layouts/
│   │       ├── AdminLayout.tsx
│   │       └── UserLayout.tsx
│   │
│   ├── context/
│   │   └── AuthContext.tsx     # Context API (backup)
│   │
│   ├── features/
│   │   └── auth/
│   │       ├── authSlice.ts    # Redux auth state
│   │       └── authAPI.ts      # Login/register logic
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBidSocket.ts     # Socket.IO logic
│   │   └── useLoginForm.ts
│   │
│   ├── pages/
│   │   ├── Home.tsx            # Landing page
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminUsers.tsx
│   │   │   ├── AdminDiamonds.tsx
│   │   │   ├── Diamonds.tsx
│   │   │   ├── CreateDiamond.tsx
│   │   │   ├── BidMonitoring.tsx
│   │   │   └── AdminResult.tsx
│   │   └── user/
│   │       ├── UserDashboard.tsx
│   │       ├── BidPage.tsx      # Main bidding interface
│   │       ├── MyBids.tsx
│   │       ├── DiamondList.tsx
│   │       └── UserDiamonds.tsx
│   │
│   ├── routes/
│   │   ├── AppRoutes.tsx       # Route definitions
│   │   └── ProtectedRoute.tsx  # Role-based auth
│   │
│   ├── services/
│   │   ├── auth/
│   │   ├── configs/
│   │   │   └── ApiService.ts   # Axios interceptor
│   │   └── index.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   ├── utils/
│   │   └── constants.ts
│   │
│   ├── App.tsx
│   └── main.tsx
```

### State Management (Redux)
```
Redux Store
├── auth (Slice)
│   ├── token: string | null
│   ├── user: AuthUser | null
│   │   ├── id: number
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── role: 'ADMIN' | 'USER'
│   │   ├── is_active: boolean
│   │   └── budget: number
│   ├── Actions:
│   │   ├── loginSuccess({token})
│   │   └── logout()
```

### Key Hooks

#### useBidSocket.ts
```typescript
useBidSocket({
  diamondId: string,
  onBidPlaced: (bid) => void,
  onBidUpdated: (bid) => void,
  onActiveUsersUpdate: (count) => void,
})
```
- Connects to Socket.IO
- Joins room: `diamond_{diamondId}`
- Listens for real-time bid updates
- Tracks active users in room

#### useAppSelector / useAppDispatch
```typescript
const { token, user } = useAppSelector((state) => state.auth)
const dispatch = useAppDispatch()
```

---

## 🔧 Backend Architecture

### Directory Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js         # DB connection
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js  # JWT verification
│   │   ├── isActiveUser.middleware.js
│   │   ├── isAdmin.middleware.js
│   │   ├── role.middleware.js
│   │   └── validation.middleware.js
│   │
│   ├── migrations/             # Database schema
│   │   ├── 001-create-users.js
│   │   ├── 002-create-diamonds.js
│   │   ├── 003-create-bids.js
│   │   ├── 004-create-bid-histories.js
│   │   ├── 005-create-results.js
│   │   ├── 006-add-time-to-diamonds.js
│   │   ├── 007-add-sold-status-to-diamonds.js
│   │   └── 008-fix-diamond-status-enum.js
│   │
│   ├── models/
│   │   ├── User.js             # Sequelize model
│   │   ├── Diamond.js
│   │   ├── Bid.js
│   │   ├── BidHistory.js
│   │   ├── Result.js
│   │   └── index.js            # Model associations
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── authController.js
│   │   │   ├── authRoutes.js
│   │   │   └── authValidation.js
│   │   ├── diamond/
│   │   │   ├── diamondController.js
│   │   │   ├── diamondRoutes.js
│   │   │   └── diamondValidation.js
│   │   ├── bid/
│   │   │   ├── bidController.js
│   │   │   ├── bidRoutes.js
│   │   │   └── bidValidation.js
│   │   ├── result/
│   │   │   ├── resultController.js
│   │   │   └── resultRoutes.js
│   │   ├── user/
│   │   └── reports/
│   │
│   ├── services/
│   │   └── diamondScheduler.js # Cron jobs
│   │
│   ├── utils/
│   │   ├── constants.js
│   │   ├── errors.js
│   │   ├── jwt.utils.js        # Token generation
│   │   └── socket.js           # Socket event handlers
│   │
│   ├── app.js                  # Express setup
│   └── server.js               # Server entry point
```

### Express Server Flow
```javascript
// server.js
const app = require('./src/app');
const http = require('http');
const socketIO = require('socket.io');

const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "http://localhost:3000" }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/diamonds', diamondRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/results', resultRoutes);

// Socket handlers
io.on('connection', (socket) => {
  socket.on('join_diamond', (diamondId) => {
    socket.join(`diamond_${diamondId}`);
    // Emit active user count
  });
  socket.on('leave_diamond', (diamondId) => {
    socket.leave(`diamond_${diamondId}`);
  });
});

// Scheduler (runs every 60 seconds)
cron.schedule('*/1 * * * *', () => {
  diamondScheduler.activatePendingDiamonds();
  diamondScheduler.closePendingDiamonds();
});
```

---

## 💾 Database Schema

### Users Table
```sql
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "email" VARCHAR(255) UNIQUE,
  "password" VARCHAR(255),
  "role" ENUM('ADMIN', 'USER'),
  "budget" DECIMAL(10, 2),
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP
);
```

### Diamonds Table
```sql
CREATE TABLE "Diamonds" (
  "id" SERIAL PRIMARY KEY,
  "diamond_name" VARCHAR(255),
  "base_price" DECIMAL(10, 2),
  "status" ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'SOLD'),
  "start_time" TIMESTAMP,
  "end_time" TIMESTAMP,
  "created_by" INTEGER REFERENCES "Users"(id),
  "deleted_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP
);
```

### Bids Table
```sql
CREATE TABLE "Bids" (
  "id" SERIAL PRIMARY KEY,
  "diamond_id" INTEGER REFERENCES "Diamonds"(id),
  "user_id" INTEGER REFERENCES "Users"(id),
  "bid_amount" DECIMAL(10, 2),
  "bid_time" TIMESTAMP,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP
);
```

### Results Table
```sql
CREATE TABLE "Results" (
  "id" SERIAL PRIMARY KEY,
  "diamond_id" INTEGER REFERENCES "Diamonds"(id),
  "winner_user_id" INTEGER REFERENCES "Users"(id),
  "winning_bid_amount" DECIMAL(10, 2),
  "status" ENUM('PENDING', 'DECLARED'),
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP
);
```

### BidHistory Table
```sql
CREATE TABLE "BidHistories" (
  "id" SERIAL PRIMARY KEY,
  "diamond_id" INTEGER REFERENCES "Diamonds"(id),
  "user_id" INTEGER REFERENCES "Users"(id),
  "bid_amount" DECIMAL(10, 2),
  "bid_time" TIMESTAMP,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP
);
```

---

## ⚡ Real-Time Features

### Socket.IO Events Flow

#### Client → Server
```typescript
// Join diamond room (when bid page loads)
socket.emit('join_diamond', diamondId);

// Leave diamond room (when bid page closes)
socket.emit('leave_diamond', diamondId);
```

#### Server → Clients (Broadcast to room)
```javascript
// After bid is placed
io.to(`diamond_${diamondId}`).emit('bid_placed', {
  diamondId,
  bidderId,
  bid_amount,
  bid_time,
  bidderName,
  bidderEmail
});

// Active users count update
io.to(`diamond_${diamondId}`).emit('active_users_update', {
  diamondId,
  activeUsersCount: 3
});

// Diamond status changed
io.emit('diamond_status_changed', {
  diamondId,
  status: 'ACTIVE',
  message: 'Bidding started'
});

// Result declared
io.to(`diamond_${diamondId}`).emit('result_declared', {
  diamondId,
  winner_user_id,
  winning_bid_amount,
  status: 'SOLD'
});
```

### Automatic Scheduler (Node Cron)

Runs every 60 seconds:

**Activation Logic:**
```javascript
// Find diamonds that should be ACTIVE
const now = new Date();
const diamondsToActivate = await Diamond.findAll({
  where: {
    status: 'DRAFT',
    start_time: { [Op.lte]: now }
  }
});

// Update to ACTIVE
await diamondsToActivate.forEach(d => {
  d.status = 'ACTIVE';
  d.save();
});
```

**Closing Logic:**
```javascript
// Find diamonds that should be CLOSED
const diamondsToClose = await Diamond.findAll({
  where: {
    status: 'ACTIVE',
    end_time: { [Op.lte]: now }
  }
});

// Update to CLOSED
await diamondsToClose.forEach(d => {
  d.status = 'CLOSED';
  d.save();
});
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{name, email, password}` | `{token, user}` |
| POST | `/api/auth/login` | `{email, password}` | `{token, user}` |
| POST | `/api/auth/logout` | - | `{success}` |

### Diamonds (Admin)
| Method | Endpoint | Authorization | Body/Params |
|--------|----------|----------------|------------|
| POST | `/api/diamonds/create` | Admin + Bearer token | `{name, basePrice, startTime, endTime}` |
| GET | `/api/diamonds` | Bearer token | - |
| GET | `/api/diamonds/:id` | Bearer token | - |
| PATCH | `/api/diamonds/:id` | Admin + Bearer token | `{name, basePrice, ...}` |
| PATCH | `/api/diamonds/:id/reschedule` | Admin + Bearer token | `{startTime, endTime}` |
| DELETE | `/api/diamonds/:id` | Admin + Bearer token | - |
| POST | `/api/diamonds/:id/close` | Admin + Bearer token | - |

### Bids (User)
| Method | Endpoint | Authorization | Body/Params |
|--------|----------|----------------|------------|
| POST | `/api/bids/place` | User + Bearer token | `{diamondId, bidAmount}` |
| GET | `/api/bids/:diamondId` | Bearer token | - |
| GET | `/api/bids/user/my-bids` | User + Bearer token | - |

### Results (Admin)
| Method | Endpoint | Authorization | Body/Params |
|--------|----------|----------------|------------|
| POST | `/api/results/declare` | Admin + Bearer token | `{diamondId}` |
| GET | `/api/results/:diamondId` | Bearer token | - |

### Users (Admin)
| Method | Endpoint | Authorization | Body/Params |
|--------|----------|----------------|------------|
| GET | `/api/users` | Admin + Bearer token | - |
| GET | `/api/users/:id` | Admin + Bearer token | - |
| PATCH | `/api/users/:id/activate` | Admin + Bearer token | - |
| PATCH | `/api/users/:id/deactivate` | Admin + Bearer token | - |

---

## 🚀 Setup & Run

### Prerequisites
- Node.js v16+
- PostgreSQL 12+
- npm 7+

### Installation

**1. Clone and install dependencies:**
```bash
cd /Users/sarvadhisolution/diamond-bid
npm install  # Root level
cd backend && npm install
cd ../frontend && npm install
```

**2. Configure environment:**

**Backend** - Create `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=diamond_bid
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Frontend** - Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

**3. Setup Database:**
```bash
cd backend
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed
```

**4. Run servers:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Development Commands

**Backend:**
- `npm run dev` - Start dev server with hot reload
- `npm test` - Run tests
- `npm run lint` - Check code quality

**Frontend:**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Check code quality

---

## 🔐 Security Features

1. **Password Hashing**: Bcryptjs with 10 salt rounds
2. **JWT Authentication**: Token-based with expiration
3. **Role-Based Access Control**: ADMIN/USER roles
4. **Input Validation**: Server-side validation on all routes
5. **CORS Protection**: Restricted to frontend URL
6. **Active User Check**: Deactivated users can't bid
7. **Bid Validation**: Amount must be > current highest

---

## 🎯 Key Workflows Summary

| Feature | Frontend | Backend | Real-time |
|---------|----------|---------|-----------|
| **Login** | Redux state + localStorage | JWT generation | - |
| **Create Diamond** | Form submission | Save to DB | - |
| **Auto-Activate** | - | Cron job (60s) | ✓ Socket broadcast |
| **Place Bid** | Modal form | Validate + Save | ✓ Socket to room |
| **Live Updates** | useBidSocket hook | Socket.IO emit | ✓ All connected clients |
| **Declare Winner** | Admin panel | Query + Result save | ✓ Socket to room |
| **Auto-Close** | - | Cron job (60s) | ✓ Socket broadcast |

---

## 📊 Data Flow Example: Complete Bid Placement

```
1. User fills bid form (Frontend)
   ↓
2. Frontend validates & calls POST /bids/place (API)
   ↓
3. Backend validates bid (amount, user status, etc.)
   ↓
4. Backend saves Bid record to PostgreSQL
   ↓
5. Backend updates BidHistory
   ↓
6. Backend emits Socket event to room: diamond_123
   ↓
7. All users in room receive bid_placed event
   ↓
8. Frontend updates bids table in real-time
   ↓
9. Active users see live bid update (no page refresh)
```

---

## 🎓 Technology Integration Map

```
┌─────────────────────────────────────────────────┐
│           FRONTEND ECOSYSTEM                    │
│  Vite → React → Redux → React Router            │
│  Socket.IO Client → Tailwind CSS                │
└────────────────────┬────────────────────────────┘
                     │ (HTTPS + WebSocket)
                     │
        ┌────────────┴────────────┐
        │   Express Server        │
        │   Node.js Runtime       │
        │   ┌────────────────┐    │
        │   │ Socket.IO      │────┤─── WebSocket
        │   │ Auth           │    │   (Real-time)
        │   │ API Routes     │    │
        │   └────────────────┘    │
        └────────────────┬────────┘
                         │ (SQL)
                         │
        ┌────────────────▼────────────────┐
        │   PostgreSQL Database           │
        │   (Persistence Layer)           │
        └─────────────────────────────────┘
```

---

## 📝 Notes

- **Token Expiry**: Configure in JWT generation function
- **Bid Tie-Breaking**: Earliest bid wins
- **Deactivated Users**: Can view but cannot bid
- **Admin Privileges**: Can create, edit, close diamonds
- **Real-time Sync**: All clients in same room get updates
- **Auto-Scheduler**: Runs independently every 60 seconds

---

## 🔗 Quick Links

- [Frontend Routes](./frontend/src/routes/AppRoutes.tsx)
- [Backend API Routes](./backend/src/modules/)
- [Socket Handlers](./backend/src/utils/socket.js)
- [Diamond Scheduler](./backend/src/services/diamondScheduler.js)
- [Redux Store](./frontend/src/app/store.ts)

