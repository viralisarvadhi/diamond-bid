import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface UserState {
  users: User[]
  currentUser: User | null
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex((user) => user.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = action.payload
      }
    },
  },
})

export const { setCurrentUser, setUsers, updateUser } = userSlice.actions
export default userSlice.reducer
