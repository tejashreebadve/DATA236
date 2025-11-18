import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { aiAgentAPI } from '../../services/api'

// Async thunks
export const chatWithAgent = createAsyncThunk(
  'aiAgent/chat',
  async ({ message, context }, { rejectWithValue }) => {
    try {
      const response = await aiAgentAPI.chat(message, context)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to chat with agent'
      )
    }
  }
)

export const generateItinerary = createAsyncThunk(
  'aiAgent/generateItinerary',
  async (data, { rejectWithValue }) => {
    try {
      const response = await aiAgentAPI.generateItinerary(data)
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to generate itinerary'
      )
    }
  }
)

export const fetchTravelerBookings = createAsyncThunk(
  'aiAgent/fetchTravelerBookings',
  async (travelerId, { rejectWithValue }) => {
    try {
      const response = await aiAgentAPI.getTravelerBookings(travelerId)
      // API returns { bookings: [...] }, extract the array
      return response.data?.bookings || response.data || []
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Failed to fetch bookings'
      )
    }
  }
)

const initialState = {
  // UI State
  isOpen: false,
  selectedBookingId: null,
  
  // Chat State
  chatMessages: [],
  chatLoading: false,
  chatError: null,
  
  // Itinerary State
  itinerary: null,
  itineraryLoading: false,
  itineraryError: null,
  
  // Bookings State (for trip selection)
  bookings: [],
  bookingsLoading: false,
  bookingsError: null,
}

const aiAgentSlice = createSlice({
  name: 'aiAgent',
  initialState,
  reducers: {
    openPanel: (state) => {
      state.isOpen = true
    },
    closePanel: (state) => {
      state.isOpen = false
      // Reset state when closing
      state.selectedBookingId = null
      state.chatMessages = []
      state.chatError = null
      state.itinerary = null
      state.itineraryError = null
    },
    selectBooking: (state, action) => {
      state.selectedBookingId = action.payload
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload)
    },
    clearChat: (state) => {
      state.chatMessages = []
      state.chatError = null
    },
    clearItinerary: (state) => {
      state.itinerary = null
      state.itineraryError = null
    },
  },
  extraReducers: (builder) => {
    // Chat
    builder
      .addCase(chatWithAgent.pending, (state) => {
        state.chatLoading = true
        state.chatError = null
      })
      .addCase(chatWithAgent.fulfilled, (state, action) => {
        state.chatLoading = false
        // Add user message - extract from meta.arg
        const userMessage = action.meta?.arg?.message || 'User message'
        state.chatMessages.push({
          type: 'user',
          content: userMessage,
          timestamp: new Date().toISOString(),
        })
        // Add assistant response - handle both string and object responses
        let assistantResponse = 'No response'
        if (typeof action.payload === 'string') {
          assistantResponse = action.payload
        } else if (action.payload?.response) {
          assistantResponse = action.payload.response
        } else if (action.payload) {
          assistantResponse = JSON.stringify(action.payload)
        }
        
        state.chatMessages.push({
          type: 'assistant',
          content: assistantResponse,
          sources: action.payload?.sources || null,
          timestamp: new Date().toISOString(),
        })
      })
      .addCase(chatWithAgent.rejected, (state, action) => {
        state.chatLoading = false
        state.chatError = action.payload
      })
    
    // Generate Itinerary
    builder
      .addCase(generateItinerary.pending, (state) => {
        state.itineraryLoading = true
        state.itineraryError = null
      })
      .addCase(generateItinerary.fulfilled, (state, action) => {
        state.itineraryLoading = false
        console.log('📦 Redux: Setting itinerary payload:', action.payload)
        // Handle different response structures
        if (action.payload?.itinerary) {
          // Response has nested itinerary object
          state.itinerary = action.payload
        } else if (action.payload?.days || action.payload?.restaurants || action.payload?.packingChecklist) {
          // Response is the itinerary object directly
          state.itinerary = { itinerary: action.payload }
        } else {
          // Use payload as-is
          state.itinerary = action.payload
        }
        console.log('📦 Redux: Final itinerary state:', state.itinerary)
      })
      .addCase(generateItinerary.rejected, (state, action) => {
        state.itineraryLoading = false
        state.itineraryError = action.payload
      })
    
    // Fetch Traveler Bookings
    builder
      .addCase(fetchTravelerBookings.pending, (state) => {
        state.bookingsLoading = true
        state.bookingsError = null
      })
      .addCase(fetchTravelerBookings.fulfilled, (state, action) => {
        state.bookingsLoading = false
        // Ensure payload is always an array
        state.bookings = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchTravelerBookings.rejected, (state, action) => {
        state.bookingsLoading = false
        state.bookingsError = action.payload
        state.bookings = [] // Reset to empty array on error
      })
  },
})

export const {
  openPanel,
  closePanel,
  selectBooking,
  addChatMessage,
  clearChat,
  clearItinerary,
} = aiAgentSlice.actions

export default aiAgentSlice.reducer

