import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api'

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ role, credentials }, { rejectWithValue }) => {
    try {
      console.log('🔐 Login attempt:', { role, email: credentials.email })
      
      const response = await authAPI.login(role, credentials)
      console.log('✅ Login response received:', response.data)
      
      const { token, refreshToken, user } = response.data

      if (!token || !user) {
        console.error('❌ Invalid login response: missing token or user')
        throw new Error('Invalid login response: missing token or user')
      }

      // Store tokens in localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))

      console.log('✅ Login successful, tokens stored')
      return { token, refreshToken, user }
    } catch (error) {
      console.error('❌ Login error:', error)
      console.error('❌ Login error response:', error.response?.data)
      
      // Extract error message
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message
        || error.message 
        || 'Login failed'
      
      console.error('❌ Login error message:', errorMessage)
      return rejectWithValue(errorMessage)
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ role, data }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(role, data)
      const { token, refreshToken, user } = response.data

      // Store tokens in localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))

      return { token, refreshToken, user }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Registration failed'
      )
    }
  }
)

export const verifyToken = createAsyncThunk(
  'auth/verify',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyToken()
      // Backend returns { valid: true, user: { ... } } or { error: { ... }, valid: false }
      if (response.data.valid && response.data.user) {
        return response.data.user
      }
      throw new Error('Invalid token response')
    } catch (error) {
      // Token invalid, clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      return rejectWithValue('Token verification failed')
    }
  }
)

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Verify Token
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(verifyToken.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.token = null
        state.refreshToken = null
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer

