import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import propertiesReducer from './slices/propertiesSlice'
import bookingsReducer from './slices/bookingsSlice'
import favoritesReducer from './slices/favoritesSlice'
import profileReducer from './slices/profileSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertiesReducer,
    bookings: bookingsReducer,
    favorites: favoritesReducer,
    profile: profileReducer,
  },
})

