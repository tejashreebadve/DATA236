import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { propertyAPI } from '../../services/api'

// Async thunks
export const fetchProperties = createAsyncThunk(
  'properties/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await propertyAPI.getAll(filters)
      return response.data.properties || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch properties'
      )
    }
  }
)

export const fetchPropertyById = createAsyncThunk(
  'properties/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await propertyAPI.getById(id)
      return response.data.property || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch property'
      )
    }
  }
)

export const createProperty = createAsyncThunk(
  'properties/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await propertyAPI.create(data)
      return response.data.property || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to create property'
      )
    }
  }
)

export const updateProperty = createAsyncThunk(
  'properties/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await propertyAPI.update(id, data)
      return response.data.property || response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to update property'
      )
    }
  }
)

export const deleteProperty = createAsyncThunk(
  'properties/delete',
  async (id, { rejectWithValue }) => {
    try {
      await propertyAPI.delete(id)
      return id
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to delete property'
      )
    }
  }
)

const initialState = {
  items: [],
  selectedProperty: null,
  searchFilters: {
    location: '',
    startDate: null,
    endDate: null,
    guests: 1,
  },
  loading: false,
  error: null,
}

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    updateSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload }
    },
    clearSearchFilters: (state) => {
      state.searchFilters = initialState.searchFilters
    },
    clearSelectedProperty: (state) => {
      state.selectedProperty = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Properties
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false
        state.items = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Property By ID
      .addCase(fetchPropertyById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedProperty = action.payload
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create Property
      .addCase(createProperty.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.error = action.payload
      })
      // Update Property
      .addCase(updateProperty.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p._id === action.payload._id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
        if (state.selectedProperty?._id === action.payload._id) {
          state.selectedProperty = action.payload
        }
      })
      // Delete Property
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload)
        if (state.selectedProperty?._id === action.payload) {
          state.selectedProperty = null
        }
      })
  },
})

export const {
  updateSearchFilters,
  clearSearchFilters,
  clearSelectedProperty,
  clearError,
} = propertiesSlice.actions
export default propertiesSlice.reducer

