# Diamond Bid Database Schema & Relationships

## 📊 Database Overview

**Database Type:** PostgreSQL  
**ORM:** Sequelize  
**Total Tables:** 5  
**Primary Key Type:** UUID (Universally Unique Identifier)

---

## 🗂️ Complete Database Schema

### 1. **Users Table** (`users`)

Stores all user accounts (both ADMIN and USER roles).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | UUID | PRIMARY KEY | Unique user identifier |
| **name** | VARCHAR(100) | NOT NULL | User's full name (2-100 chars) |
| **email** | VARCHAR | UNIQUE, NOT NULL | User email (validated) |
| **password** | VARCHAR | NOT NULL | Hashed password (bcrypt) |
| **role** | ENUM | NOT NULL | 'ADMIN' or 'USER' (default: USER) |
| **budget** | DECIMAL(15,2) | DEFAULT 0 | User's bidding budget |
| **is_active** | BOOLEAN | DEFAULT true | Account active/deactivated status |
| **created_at** | TIMESTAMP | DEFAULT NOW | Account creation time |
| **updated_at** | TIMESTAMP | DEFAULT NOW | Last update time |
| **deleted_at** | TIMESTAMP | NULL | Soft delete timestamp |

**Indexes:**
- Primary: `id` (UUID)
- Unique: `email`

**Validation Rules:**
- Name: 2-100 characters
- Email: Valid email format
- Budget: >= 0
- Password: Hashed with bcryptjs (10 salt rounds)

---

### 2. **Diamonds Table** (`diamonds`)

Stores diamond listings created by admins for auction.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | UUID | PRIMARY KEY | Unique diamond identifier |
| **diamond_name** | VARCHAR(255) | NOT NULL | Diamond display name |
| **base_price** | DECIMAL(15,2) | NOT NULL | Starting bid price |
| **status** | ENUM | NOT NULL | 'DRAFT', 'ACTIVE', 'CLOSED', 'SOLD' |
| **start_time** | TIMESTAMP | NULL | Scheduled auction start time |
| **end_time** | TIMESTAMP | NULL | Scheduled auction end time |
| **created_at** | TIMESTAMP | DEFAULT NOW | Record creation time |
| **updated_at** | TIMESTAMP | DEFAULT NOW | Last update time |
| **deleted_at** | TIMESTAMP | NULL | Soft delete timestamp |

**Indexes:**
- Primary: `id` (UUID)

**Status Lifecycle:**
```
DRAFT → ACTIVE → CLOSED → SOLD
  ↑        ↑        ↑        ↑
  │        │        │        │
Created  Auto-   Auto-   Admin
         Start   Close  Declares
                        Winner
```

**Validation Rules:**
- Name: 2-255 characters
- Base Price: >= 0
- Start time must be before end time

---

### 3. **Bids Table** (`bids`)

Stores all bids placed by users on diamonds.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | UUID | PRIMARY KEY | Unique bid identifier |
| **user_id** | UUID | FOREIGN KEY → users.id | Bidder's user ID |
| **diamond_id** | UUID | FOREIGN KEY → diamonds.id | Diamond being bid on |
| **bid_amount** | DECIMAL(15,2) | NOT NULL | Bid amount |
| **created_at** | TIMESTAMP | DEFAULT NOW | Bid placement time |
| **updated_at** | TIMESTAMP | DEFAULT NOW | Last update time (if edited) |
| **deleted_at** | TIMESTAMP | NULL | Soft delete timestamp |

**Indexes:**
- Primary: `id` (UUID)
- Composite: `(user_id, diamond_id)` - One user can update their bid
- Index: `diamond_id` - Fast lookup of all bids for a diamond

**Validation Rules:**
- Bid amount: >= 0
- Bid must be higher than current highest bid
- User must be active (is_active = true)
- Diamond must be ACTIVE

---

### 4. **Results Table** (`results`)

Stores declared winners for completed auctions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | UUID | PRIMARY KEY | Unique result identifier |
| **diamond_id** | UUID | UNIQUE, FOREIGN KEY → diamonds.id | Diamond auction (one result per diamond) |
| **winner_user_id** | UUID | FOREIGN KEY → users.id | Winning user ID |
| **winning_bid_amount** | DECIMAL(15,2) | NOT NULL | Final winning bid amount |
| **declared_at** | TIMESTAMP | DEFAULT NOW | Result declaration time |
| **deleted_at** | TIMESTAMP | NULL | Soft delete timestamp |

**Indexes:**
- Primary: `id` (UUID)
- Unique: `diamond_id` - One winner per diamond
- Index: `winner_user_id` - Fast lookup of all wins by user

**Validation Rules:**
- Winning amount: >= 0
- Diamond must be CLOSED
- Only one result per diamond

---

### 5. **BidHistory Table** (`bid_histories`)

Tracks all bid updates/edits for audit trail.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | UUID | PRIMARY KEY | Unique history record ID |
| **bid_id** | UUID | FOREIGN KEY → bids.id | Related bid |
| **old_amount** | DECIMAL(15,2) | NULL | Previous bid amount (null on first bid) |
| **new_amount** | DECIMAL(15,2) | NOT NULL | New/updated bid amount |
| **edited_at** | TIMESTAMP | DEFAULT NOW | Time of bid change |
| **deleted_at** | TIMESTAMP | NULL | Soft delete timestamp |

**Indexes:**
- Primary: `id` (UUID)
- Index: `bid_id` - Fast lookup of history for a bid

**Purpose:**
- Audit trail for bid changes
- Prevents bid manipulation
- Tracks bid evolution over time

---

## 🔗 Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DATABASE RELATIONSHIPS                           │
└──────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │       USERS         │
                    │ ─────────────────── │
                    │ PK: id (UUID)       │
                    │ • name              │
                    │ • email (UNIQUE)    │
                    │ • password          │
                    │ • role (ENUM)       │
                    │ • budget            │
                    │ • is_active         │
                    └──────┬──────────┬───┘
                           │          │
              ┌────────────┘          └─────────────┐
              │ (1:N)                          (1:N)│
              │                                     │
              ▼                                     ▼
    ┌──────────────────┐                  ┌──────────────────┐
    │      BIDS        │                  │    RESULTS       │
    │ ──────────────── │                  │ ──────────────── │
    │ PK: id (UUID)    │                  │ PK: id (UUID)    │
    │ FK: user_id      │──────┐           │ FK: diamond_id   │
    │ FK: diamond_id   │      │           │ FK: winner_user_id│
    │ • bid_amount     │      │           │ • winning_amount │
    │ • created_at     │      │           │ • declared_at    │
    └──────┬───────────┘      │           └────────┬─────────┘
           │                  │                    │
           │(1:N)             │                    │(1:1)
           │                  │                    │
           ▼                  │                    │
    ┌──────────────────┐     │                    │
    │  BID_HISTORIES   │     │                    │
    │ ──────────────── │     │                    │
    │ PK: id (UUID)    │     │                    │
    │ FK: bid_id       │     │                    │
    │ • old_amount     │     │                    │
    │ • new_amount     │     │                    │
    │ • edited_at      │     │                    │
    └──────────────────┘     │                    │
                             │                    │
                             │                    │
                             │  ┌─────────────────┴────────┐
                             │  │       DIAMONDS           │
                             │  │ ──────────────────────── │
                             │  │ PK: id (UUID)            │
                             │  │ • diamond_name           │
                             └─▶│ • base_price             │
                                │ • status (ENUM)          │
                                │ • start_time             │
                                │ • end_time               │
                                └──────────────────────────┘

Legend:
  ─────▶  One-to-Many (1:N)
  ══════▶ One-to-One (1:1)
  FK      Foreign Key
  PK      Primary Key
  UNIQUE  Unique Constraint
```

---

## 🔄 Relationship Details

### 1. **User ↔ Bids** (One-to-Many)

```javascript
// User Model
User.hasMany(Bid, {
    foreignKey: 'user_id',
    as: 'bids'
});

// Bid Model
Bid.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});
```

**Relationship:**
- One User can place **many Bids** across different diamonds
- Each Bid belongs to **one User**

**Use Case:**
- Fetch all bids placed by a specific user
- Get user details for each bid

**Query Example:**
```javascript
// Get user with all their bids
const user = await User.findByPk(userId, {
    include: [{ model: Bid, as: 'bids' }]
});

// Get bid with user information
const bid = await Bid.findByPk(bidId, {
    include: [{ model: User, as: 'user' }]
});
```

---

### 2. **Diamond ↔ Bids** (One-to-Many)

```javascript
// Diamond Model
Diamond.hasMany(Bid, {
    foreignKey: 'diamond_id',
    as: 'bids',
    onDelete: 'CASCADE'  // Delete all bids if diamond deleted
});

// Bid Model
Bid.belongsTo(Diamond, {
    foreignKey: 'diamond_id',
    as: 'diamond'
});
```

**Relationship:**
- One Diamond can have **many Bids** from different users
- Each Bid belongs to **one Diamond**

**Cascade Delete:**
- When a diamond is soft-deleted, all related bids are also soft-deleted

**Use Case:**
- Fetch all bids for a specific diamond
- Get diamond details for each bid

**Query Example:**
```javascript
// Get diamond with all bids
const diamond = await Diamond.findByPk(diamondId, {
    include: [{ 
        model: Bid, 
        as: 'bids',
        include: [{ model: User, as: 'user' }]  // Nested join
    }]
});

// Get highest bid for a diamond
const highestBid = await Bid.findOne({
    where: { diamond_id: diamondId },
    order: [['bid_amount', 'DESC']]
});
```

---

### 3. **Diamond ↔ Result** (One-to-One)

```javascript
// Diamond Model
Diamond.hasOne(Result, {
    foreignKey: 'diamond_id',
    as: 'result',
    onDelete: 'CASCADE'
});

// Result Model
Result.belongsTo(Diamond, {
    foreignKey: 'diamond_id',
    as: 'diamond'
});
```

**Relationship:**
- One Diamond has **exactly one Result** (or none if not yet declared)
- Each Result belongs to **one Diamond**

**Unique Constraint:**
- `diamond_id` in Results table is UNIQUE (one winner per diamond)

**Use Case:**
- Fetch winner information for a diamond
- Check if result has been declared

**Query Example:**
```javascript
// Get diamond with result
const diamond = await Diamond.findByPk(diamondId, {
    include: [{ 
        model: Result, 
        as: 'result',
        include: [{ model: User, as: 'winner' }]
    }]
});

// Check if winner declared
if (diamond.result) {
    console.log(`Winner: ${diamond.result.winner.name}`);
}
```

---

### 4. **User ↔ Results** (One-to-Many)

```javascript
// User Model
User.hasMany(Result, {
    foreignKey: 'winner_user_id',
    as: 'winningResults'
});

// Result Model
Result.belongsTo(User, {
    foreignKey: 'winner_user_id',
    as: 'winner'
});
```

**Relationship:**
- One User can win **many Diamonds** (multiple results)
- Each Result has **one Winner User**

**Use Case:**
- Fetch all diamonds won by a user
- Get winner details for a result

**Query Example:**
```javascript
// Get all diamonds won by user
const user = await User.findByPk(userId, {
    include: [{ 
        model: Result, 
        as: 'winningResults',
        include: [{ model: Diamond, as: 'diamond' }]
    }]
});

console.log(`User won ${user.winningResults.length} diamonds`);
```

---

### 5. **Bid ↔ BidHistory** (One-to-Many)

```javascript
// Bid Model
Bid.hasMany(BidHistory, {
    foreignKey: 'bid_id',
    as: 'bidHistory',
    onDelete: 'CASCADE'
});

// BidHistory Model
BidHistory.belongsTo(Bid, {
    foreignKey: 'bid_id',
    as: 'bid'
});
```

**Relationship:**
- One Bid can have **many History records** (when user updates bid)
- Each History record belongs to **one Bid**

**Cascade Delete:**
- When a bid is deleted, all history records are also deleted

**Use Case:**
- Track bid evolution over time
- Audit trail for bid changes
- Prevent bid manipulation

**Query Example:**
```javascript
// Get bid with complete history
const bid = await Bid.findByPk(bidId, {
    include: [{ 
        model: BidHistory, 
        as: 'bidHistory',
        order: [['edited_at', 'ASC']]
    }]
});

// Show bid evolution
bid.bidHistory.forEach(h => {
    console.log(`${h.edited_at}: ${h.old_amount} → ${h.new_amount}`);
});
```

---

## 🎯 Common Query Patterns

### 1. Get Diamond with All Bids and Winner

```javascript
const diamond = await Diamond.findByPk(diamondId, {
    include: [
        {
            model: Bid,
            as: 'bids',
            include: [{ model: User, as: 'user' }],
            order: [['bid_amount', 'DESC']]
        },
        {
            model: Result,
            as: 'result',
            include: [{ model: User, as: 'winner' }]
        }
    ]
});
```

### 2. Get User's Complete Bidding Profile

```javascript
const user = await User.findByPk(userId, {
    include: [
        { 
            model: Bid, 
            as: 'bids',
            include: [{ model: Diamond, as: 'diamond' }]
        },
        { 
            model: Result, 
            as: 'winningResults',
            include: [{ model: Diamond, as: 'diamond' }]
        }
    ]
});

// User's statistics
const totalBids = user.bids.length;
const totalWins = user.winningResults.length;
const winRate = (totalWins / totalBids * 100).toFixed(2);
```

### 3. Get Active Diamonds with Bid Counts

```javascript
const activeDiamonds = await Diamond.findAll({
    where: { status: 'ACTIVE' },
    include: [
        { 
            model: Bid, 
            as: 'bids',
            attributes: []  // Don't return bid data, just count
        }
    ],
    attributes: {
        include: [
            [sequelize.fn('COUNT', sequelize.col('bids.id')), 'bid_count']
        ]
    },
    group: ['Diamond.id']
});
```

### 4. Find Winner for a Diamond (Highest Bid with Tie-Breaking)

```javascript
// Find highest bid
const highestBid = await Bid.findOne({
    where: { diamond_id: diamondId },
    order: [
        ['bid_amount', 'DESC'],  // Highest amount first
        ['created_at', 'ASC']    // Earliest time wins tie
    ],
    include: [{ model: User, as: 'user' }]
});

if (highestBid) {
    // Create result
    await Result.create({
        diamond_id: diamondId,
        winner_user_id: highestBid.user_id,
        winning_bid_amount: highestBid.bid_amount
    });
    
    // Update diamond status
    await Diamond.update(
        { status: 'SOLD' },
        { where: { id: diamondId } }
    );
}
```

---

## 🔒 Data Integrity Features

### 1. **Soft Deletes (Paranoid Mode)**

All tables use soft deletes via `deleted_at` timestamp:

```javascript
// Soft delete a diamond (sets deleted_at)
await Diamond.destroy({ where: { id: diamondId } });

// Query includes soft-deleted records
const all = await Diamond.findAll({ paranoid: false });

// Restore soft-deleted record
await Diamond.restore({ where: { id: diamondId } });

// Permanently delete (force)
await Diamond.destroy({ where: { id: diamondId }, force: true });
```

**Why Soft Deletes?**
- Preserves data for audit trails
- Allows recovery of accidentally deleted records
- Maintains referential integrity

---

### 2. **Cascade Operations**

**Diamond → Bids:**
- When diamond is deleted, all bids are also soft-deleted
- Prevents orphaned bid records

**Bid → BidHistory:**
- When bid is deleted, all history records are deleted
- Maintains clean history trail

---

### 3. **Unique Constraints**

| Table | Column | Purpose |
|-------|--------|---------|
| Users | email | One account per email address |
| Results | diamond_id | One winner per diamond auction |

---

### 4. **Indexes for Performance**

| Table | Index | Purpose |
|-------|-------|---------|
| Bids | (user_id, diamond_id) | Fast lookup of user's bid on specific diamond |
| Bids | diamond_id | Fast retrieval of all bids for a diamond |
| Results | winner_user_id | Fast lookup of all wins by user |
| BidHistory | bid_id | Fast retrieval of bid edit history |

---

## 📈 Database Statistics & Capacity

### Storage Estimates

**Per Record Size (approximate):**
- User: ~200 bytes
- Diamond: ~180 bytes
- Bid: ~100 bytes
- Result: ~100 bytes
- BidHistory: ~80 bytes

**Example for 10,000 users:**
- 10,000 users × 200 bytes = ~2 MB
- 1,000 diamonds × 180 bytes = ~180 KB
- 100,000 bids × 100 bytes = ~10 MB
- 1,000 results × 100 bytes = ~100 KB
- 50,000 history records × 80 bytes = ~4 MB

**Total: ~16.3 MB** (very scalable!)

---

## 🔧 Database Maintenance

### Migration Order (Already Applied)

1. `001-create-users.js` - Create users table
2. `002-create-diamonds.js` - Create diamonds table
3. `003-create-bids.js` - Create bids table (FK to users + diamonds)
4. `004-create-bid-histories.js` - Create bid_histories table (FK to bids)
5. `005-create-results.js` - Create results table (FK to diamonds + users)
6. `006-add-time-to-diamonds.js` - Add start_time/end_time columns
7. `007-add-sold-status-to-diamonds.js` - Add SOLD enum value
8. `008-fix-diamond-status-enum.js` - Fix status ENUM type

---

## 🎓 Key Takeaways

1. **UUID Primary Keys**: Better for distributed systems, no collision risk
2. **Soft Deletes**: All tables support paranoid mode for data recovery
3. **Cascading Deletes**: Related data cleaned up automatically
4. **Audit Trail**: BidHistory tracks all bid modifications
5. **One Result Per Diamond**: Enforced via UNIQUE constraint
6. **Tie-Breaking**: Earliest bid wins when amounts are equal
7. **Role-Based Access**: Users table stores ADMIN/USER roles
8. **Budget Tracking**: Users have budget field for spending limits
9. **Status Lifecycle**: Diamonds progress through DRAFT → ACTIVE → CLOSED → SOLD
10. **Real-time Ready**: Structure supports Socket.IO event emissions

---

## 📚 Related Documentation

- See `COMPLETE_ARCHITECTURE.md` for full system workflow
- See individual model files in `backend/src/models/` for detailed validations
- See migration files in `backend/src/migrations/` for schema evolution

