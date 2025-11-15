import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { travelerAPI, ownerAPI, bookingAPI } from '../../services/api'

// Async thunks
export const fetchBookings = createAsyncThunk(
  'bookings/fetchAll',
  async (role, { rejectWithValue }) => {
    try {
      const api = role === 'traveler' ? travelerAPI : ownerAPI
      const response = await api.getBookings()
      // Backend returns array directly, not wrapped in { bookings: [...] }
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch bookings'
      )
    }
  }
)

export const fetchBookingById = createAsyncThunk(
  'bookings/fetchById',
  async ({ id, role }, { rejectWithValue }) => {
    try {
      const response = role === 'owner'
        ? await ownerAPI.getBooking(id)
        : await bookingAPI.getById(id)
      // Backend returns booking directly, not wrapped
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch booking'
      )
    }
  }
)

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (data, { rejectWithValue }) => {
    try {
      // Frontend calls booking-service directly via travelerAPI.createBooking
      // But traveler-service doesn't have this endpoint, it should call booking-service
      // Actually, the frontend should call booking-service directly, not via traveler-service
      // Let's check the API service - it should be calling /api/booking
      const response = await travelerAPI.createBooking(data)
      // Backend returns booking directly, not wrapped
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to create booking'
      )
    }
  }
)

export const acceptBooking = createAsyncThunk(
  'bookings/accept',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ownerAPI.acceptBooking(id)
      // Backend returns booking directly, not wrapped
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to accept booking'
      )
    }
  }
)

export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const response = await ownerAPI.cancelBooking(id)
      // Backend returns booking directly, not wrapped
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to cancel booking'
      )
    }
  }
)

const initialState = {
  items: [],
  selectedBooking: null,
  filters: {
    status: 'all', // 'all', 'pending', 'accepted', 'cancelled'
  },
  loading: false,
  error: null,
}

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearSelectedBooking: (state) => {
      state.selectedBooking = null
    },
    updateBookingStatus: (state, action) => {
      const { id, status } = action.payload
      const booking = state.items.find((b) => b._id === id)
      if (booking) {
        booking.status = status
      }
      if (state.selectedBooking?._id === id) {
        state.selectedBooking.status = status
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false
        state.items = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Booking By ID
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.selectedBooking = action.payload
      })
      // Create Booking
      .addCase(createBooking.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.error = action.payload
      })
      // Accept Booking
      .addCase(acceptBooking.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (b) => b._id === action.payload._id
        )
        if (index !== -1) {
          state.items[index] = action.payload
        }
        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload
        }
      })
      // Cancel Booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (b) => b._id === action.payload._id
        )
        if (index !== -1) {
          state.items[index] = action.payload
        }
        if (state.selectedBooking?._id === action.payload._id) {
          state.selectedBooking = action.payload
        }
      })
  },
})

export const {
  setFilter,
  clearSelectedBooking,
  updateBookingStatus,
  clearError,
} = bookingsSlice.actions
export default bookingsSlice.reducer

