import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { travelerAPI } from '../../services/api'
import { transformProperties } from '../../utils/transformProperty'

// Async thunks
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await travelerAPI.getFavorites()
      // Backend returns array of properties directly (from getPropertiesByIds)
      const favorites = Array.isArray(response.data) ? response.data : []
      // Transform properties to frontend format
      return transformProperties(favorites)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch favorites'
      )
    }
  }
)

export const addFavorite = createAsyncThunk(
  'favorites/add',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await travelerAPI.addFavorite(propertyId)
      return response.data.property || response.data.favorite?.propertyId || { _id: propertyId }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to add favorite'
      )
    }
  }
)

export const removeFavorite = createAsyncThunk(
  'favorites/remove',
  async (propertyId, { rejectWithValue }) => {
    try {
      await travelerAPI.removeFavorite(propertyId)
      return propertyId
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to remove favorite'
      )
    }
  }
)

const initialState = {
  items: [],
  loading: false,
  error: null,
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false
        state.items = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add Favorite
      .addCase(addFavorite.fulfilled, (state, action) => {
        const exists = state.items.some((item) => item._id === action.payload._id)
        if (!exists) {
          state.items.push(action.payload)
        }
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.error = action.payload
      })
      // Remove Favorite
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item._id !== action.payload
        )
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearError } = favoritesSlice.actions
export default favoritesSlice.reducer

