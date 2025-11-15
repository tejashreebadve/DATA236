import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { travelerAPI, ownerAPI } from '../../services/api'

// Async thunks
export const fetchProfile = createAsyncThunk(
  'profile/fetch',
  async (role, { rejectWithValue }) => {
    try {
      const api = role === 'traveler' ? travelerAPI : ownerAPI
      const response = await api.getProfile()
      // Backend returns profile directly, not wrapped in { traveler: ... } or { owner: ... }
      return { role, profile: response.data }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch profile'
      )
    }
  }
)

export const updateProfile = createAsyncThunk(
  'profile/update',
  async ({ role, data }, { rejectWithValue }) => {
    try {
      const api = role === 'traveler' ? travelerAPI : ownerAPI
      const response = await api.updateProfile(data)
      // Backend returns profile directly
      return { role, profile: response.data }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to update profile'
      )
    }
  }
)

export const uploadProfilePicture = createAsyncThunk(
  'profile/uploadPicture',
  async ({ role, file }, { rejectWithValue }) => {
    try {
      const api = role === 'traveler' ? travelerAPI : ownerAPI
      const response = await api.uploadProfilePicture(file)
      // Backend returns { imageUrl, message }
      // We need to refetch the profile to get the updated profile with the new picture
      const profileResponse = await api.getProfile()
      return { role, profile: profileResponse.data }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to upload profile picture'
      )
    }
  }
)

const initialState = {
  traveler: null,
  owner: null,
  loading: false,
  error: null,
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.traveler = null
      state.owner = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.role === 'traveler') {
          state.traveler = action.payload.profile
        } else {
          state.owner = action.payload.profile
        }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.role === 'traveler') {
          state.traveler = action.payload.profile
        } else {
          state.owner = action.payload.profile
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Upload Profile Picture
      .addCase(uploadProfilePicture.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.role === 'traveler') {
          state.traveler = action.payload.profile
        } else {
          state.owner = action.payload.profile
        }
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearProfile, clearError } = profileSlice.actions
export default profileSlice.reducer

