# Redux vs Context API - State Management Comparison

## 📊 Overview

| Aspect | Redux | Context API |
|--------|-------|-------------|
| **Status** | ✅ **ACTIVELY USED** | ⚠️ **Created but NOT used** |
| **Purpose** | Authentication state | Backup (legacy) |
| **Complexity** | High (scalable) | Low (simple) |
| **Performance** | Optimized | Can cause re-renders |
| **Persistence** | ✅ localStorage | ❌ No |
| **Middleware** | ✅ Yes | ❌ No |

---

## 🎯 Redux - ACTIVE State Management

### Location
- **Store Setup:** `frontend/src/app/store.ts`
- **Auth Slice:** `frontend/src/features/auth/authSlice.ts`
- **Hooks:** `frontend/src/app/hooks.ts`

### What Redux Manages

#### Authentication State
```typescript
interface AuthState {
    token: string | null        // JWT token from backend
    user: AuthUser | null       // User object (decoded from token)
}

interface AuthUser {
    id: number
    name: string               // User's display name
    role: 'ADMIN' | 'USER'     // User role
    is_active: boolean         // Account status
    budget: number             // User's budget
}
```

### Redux Features Implemented

#### 1. **Automatic Token Persistence**
```typescript
// On app load, token is restored from localStorage
const storedToken = typeof window !== 'undefined' 
    ? localStorage.getItem('token') 
    : null

// User is reconstructed by decoding the token
const storedUser = storedToken ? buildUserFromToken(storedToken) : null
```

**Benefit:** Users stay logged in even after page refresh!

#### 2. **JWT Token Decoding**
```typescript
const buildUserFromToken = (token: string): AuthUser | null => {
    const payload = decodeToken(token)
    if (!payload) return null
    
    return {
        id: payload.id ?? 0,
        name: payload.name ?? 'User',
        role: payload.role ?? 'USER',
        is_active: payload.is_active ?? true,
        budget: payload.budget ?? 0,
    }
}
```

**Benefit:** No need for extra API calls to get user info!

#### 3. **Redux Actions**
```typescript
// loginSuccess - Called after successful login
dispatch(loginSuccess({ token }))
// Automatically:
// 1. Decodes token
// 2. Extracts user data
// 3. Saves to localStorage
// 4. Updates Redux state

// logout - Called on logout
dispatch(logout())
// Automatically:
// 1. Clears token from state
// 2. Clears user from state
// 3. Removes from localStorage
```

### Redux Usage in Components

#### 24 Components Using Redux

**Components that READ auth state:**
```typescript
const { token, user } = useAppSelector((state) => state.auth)
```

**Files using Redux:**
1. `src/pages/user/DiamondList.tsx` - Get token for API calls
2. `src/pages/user/BidPage.tsx` - Get user info for bid page
3. `src/pages/admin/Diamonds.tsx` - Get token for admin operations
4. `src/pages/admin/BidMonitoring.tsx` - Get token & user
5. `src/routes/ProtectedRoute.tsx` - Check authentication
6. `src/pages/Home.tsx` - Check login status
7. `src/pages/admin/AdminUsers.tsx` - Get current user info
8. `src/pages/user/MyBids.tsx` - Get token for API
9. `src/pages/admin/CreateDiamond.tsx` - Get token
10. `src/pages/auth/Login.tsx` - **DISPATCH** loginSuccess
11. `src/pages/auth/Register.tsx` - **DISPATCH** loginSuccess
12. `src/components/auth/LogoutButton.tsx` - **DISPATCH** logout
... and 12+ more

### Redux Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REDUX DATA FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. LOGIN FLOW:
   ┌──────────────┐
   │ User submits │
   │ Login form   │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ POST /auth/login                     │
   │ Request: {email, password}           │
   │ Response: {token, user}              │
   └──────┬───────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ dispatch(loginSuccess({token}))      │
   │ - Decode JWT token                   │
   │ - Extract user info from payload     │
   │ - Save token to localStorage         │
   │ - Update Redux state                 │
   └──────┬───────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ Redux Store Updated:                 │
   │ {                                    │
   │   token: "eyJhbGc...",              │
   │   user: {                            │
   │     id: 1,                           │
   │     name: "John",                    │
   │     role: "USER",                    │
   │     is_active: true,                 │
   │     budget: 50000                    │
   │   }                                  │
   │ }                                    │
   └──────┬───────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ All Components using useAppSelector │
   │ automatically re-render              │
   │ Navigation to dashboard              │
   └──────────────────────────────────────┘

2. PAGE REFRESH (PERSISTENCE):
   ┌──────────────┐
   │ User refreshes│
   │ page         │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ App initializes                      │
   │ authSlice checks localStorage        │
   │ const storedToken = localStorage.    │
   │   getItem('token')                   │
   └──────┬───────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ Token found in localStorage          │
   │ Decode token to get user info        │
   │ Set initial Redux state              │
   │ User is already logged in!           │
   └──────┬───────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ Dashboard loads immediately          │
   │ No need to re-login                  │
   └──────────────────────────────────────┘

3. LOGOUT FLOW:
   ┌──────────────┐
   │ User clicks  │
   │ Logout       │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ dispatch(logout())                   │
   │ - Clear Redux state                  │
   │ - Remove token from localStorage     │
   │ - Clear user data                    │
   └──────┬───────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ Redux Store Updated:                 │
   │ {                                    │
   │   token: null,                       │
   │   user: null                         │
   │ }                                    │
   └──────┬───────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ Redirect to /login                   │
   │ ProtectedRoute prevents access       │
   └──────────────────────────────────────┘
```

### Redux Code Example

**Accessing auth in a component:**
```typescript
import { useAppSelector, useAppDispatch } from '../../app/hooks'
import { loginSuccess, logout } from '../../features/auth/authSlice'

const MyComponent: React.FC = () => {
    // Read state
    const { token, user } = useAppSelector((state) => state.auth)
    
    // Dispatch actions
    const dispatch = useAppDispatch()
    
    const handleLogin = async () => {
        const response = await loginAPI(email, password)
        dispatch(loginSuccess({ token: response.data.token }))
    }
    
    const handleLogout = () => {
        dispatch(logout())
    }
    
    return (
        <div>
            {user && <p>Welcome, {user.name}!</p>}
            {token && <p>Logged in with token: {token.substring(0, 20)}...</p>}
        </div>
    )
}
```

---

## 🔌 Context API - NOT ACTIVELY USED

### Location
- **File:** `frontend/src/context/AuthContext.tsx`
- **Hook:** `frontend/src/hooks/useAuth.ts`

### Context Implementation

```typescript
interface AuthContextType {
  isAuthenticated: boolean
  user: any | null
  login: (user: any) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<any | null>(null)

  const login = (userData: any) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Why Context is NOT Used

**Issues with Context approach:**
1. ❌ **No persistence** - No localStorage integration
2. ❌ **Performance** - Every state change re-renders all consumers
3. ❌ **No middleware** - Can't intercept actions
4. ❌ **Manual management** - No automatic token encoding/decoding
5. ❌ **Page refresh loses state** - User needs to login again

**Example of the problem:**
```typescript
// With Context API:
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null) // Lost on page refresh!
  // User needs to login again after refresh
}

// With Redux:
const initialState = {
  token: localStorage.getItem('token'), // Retrieved on refresh
  user: buildUserFromToken(storedToken) // Still logged in!
}
```

### Context Current Status
- ✅ Created and exported
- ❌ **Not imported anywhere in the app**
- ❌ Not used in main.tsx provider
- ⚠️ Kept as backup (could be used in future for other state)

---

## 📍 Comparison Table

| Feature | Redux | Context |
|---------|-------|---------|
| **Used for** | ✅ Authentication | ❌ Not used |
| **Persistence** | ✅ localStorage | ❌ No |
| **Token Management** | ✅ Automatic | ❌ Manual |
| **Performance** | ✅ Optimized | ⚠️ Can be slow |
| **Scalability** | ✅ Excellent | ⚠️ Limited |
| **Middleware** | ✅ Yes | ❌ No |
| **DevTools** | ✅ Redux DevTools | ❌ No |
| **Async Actions** | ✅ thunks/saga | ❌ Manual |
| **Page Refresh** | ✅ Stays logged in | ❌ Loses login |
| **localStorage** | ✅ Auto sync | ❌ Manual |

---

## 🎯 What Each Manages

### Redux Manages
```typescript
// AUTHENTICATION STATE
- User token (JWT)
- User ID
- User name
- User role (ADMIN/USER)
- User active status
- User budget
- Login/logout actions
- Token persistence
```

### Context Manages (NOT CURRENTLY USED)
```typescript
// WOULD MANAGE (if used):
- isAuthenticated flag
- User object
- login() function
- logout() function
```

### API Calls Handle Everything Else
```typescript
// API Calls Manage:
- Diamonds (create, read, update, delete)
- Bids (place, update)
- Results (declare, view)
- Users (admin management)
- Real-time updates (Socket.IO)
```

---

## 🚀 Redux Setup

### Store Configuration
```typescript
// frontend/src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,  // Only Redux slice currently
    },
})
```

### In main.tsx
```typescript
import { Provider } from 'react-redux'
import store from './app/store'

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

### Hooks
```typescript
// frontend/src/app/hooks.ts
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
```

---

## 💡 Component Usage Examples

### Example 1: Reading Redux State (BidPage.tsx)
```typescript
import { useAppSelector } from '../../app/hooks'

const BidPage: React.FC = () => {
    // Get token and user from Redux
    const { token, user } = useAppSelector((state) => state.auth)
    
    // Use token for API calls
    const placeBid = async (amount: number) => {
        const response = await fetch('/api/user/bid', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ diamondId, bid_amount: amount })
        })
    }
    
    // Use user for UI
    return (
        <div>
            <p>Welcome {user?.name}</p>
            <p>Budget: ${user?.budget}</p>
        </div>
    )
}
```

### Example 2: Dispatching Redux Action (Login.tsx)
```typescript
import { useAppDispatch } from '../../app/hooks'
import { loginSuccess } from '../../features/auth/authSlice'

const Login: React.FC = () => {
    const dispatch = useAppDispatch()
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Call login API
        const response = await loginAPI(email, password)
        const { token } = response.data
        
        // Dispatch Redux action
        dispatch(loginSuccess({ token }))
        
        // Redirect (Redux automatically updated!)
        navigate('/user/dashboard')
    }
    
    return <form onSubmit={handleSubmit}>...</form>
}
```

### Example 3: Protected Routes (ProtectedRoute.tsx)
```typescript
import { useAppSelector } from '../app/hooks'

const ProtectedRoute: React.FC<Props> = ({ allowedRoles, children }) => {
    // Check auth state from Redux
    const { token, user } = useAppSelector((state) => state.auth)
    const isAuthenticated = Boolean(token)
    
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />
    }
    
    if (!allowedRoles?.includes(user.role)) {
        return <Navigate to="/login" replace />
    }
    
    return <Outlet />
}
```

---

## 🎓 Why Redux for Authentication?

### 1. **Persistence Across Page Refreshes**
Redux + localStorage = Stay logged in even after refresh

### 2. **Single Source of Truth**
All components read from the same Redux store
No prop drilling needed

### 3. **Performance**
Only subscribing components re-render
Context re-renders all consumers

### 4. **DevTools**
Redux DevTools browser extension for debugging
Can replay actions, see state history

### 5. **Scalability**
Easy to add more slices (user, diamonds, bids, etc.)
Context would become unwieldy

### 6. **Middleware Support**
Can add logging, error handling, etc.
Context has no such capability

---

## 🔄 When to Use Redux vs Context

### Use Redux for:
- ✅ Authentication state (currently used)
- ✅ Global app state that needs persistence
- ✅ State that many components need
- ✅ Complex state logic
- ✅ Need middleware/DevTools

### Use Context for:
- ✅ Theme (light/dark mode)
- ✅ Language/Localization
- ✅ Non-critical UI state
- ✅ Small feature flags
- ✅ Low-frequency updates

---

## 📊 Current Architecture

```
┌─────────────────────────────────────────────────┐
│        DIAMOND BID STATE MANAGEMENT             │
└─────────────────────────────────────────────────┘

Redux (Active)
├── auth slice
│   ├── token
│   ├── user { id, name, role, is_active, budget }
│   └── actions { loginSuccess, logout }
└── Used in 24+ components
    ├── Pages (User, Admin, Auth)
    ├── Routes
    └── Layouts

Context API (Not Active)
├── AuthContext (created but not used)
└── useAuth hook (created but not used)

API State (handled in components)
├── diamonds
├── bids
├── results
├── users
└── Socket.IO (real-time)
```

---

## ✅ Conclusion

**Your app uses:**
1. **Redux** ✅ - For persistent authentication state
2. **Context** ⚠️ - Created but not used (backup)
3. **API Calls** ✅ - For all other data (diamonds, bids, etc.)
4. **Socket.IO** ✅ - For real-time updates

This is a **solid architecture** - Redux handles persistence, API calls handle business logic, Socket.IO handles real-time updates!

