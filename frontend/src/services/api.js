import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (role, credentials) =>
    api.post(`/api/auth/login/${role}`, credentials),
  register: (role, data) => api.post(`/api/auth/register/${role}`, data),
  verifyToken: () => api.get('/api/auth/verify'),
}

// Property API
export const propertyAPI = {
  getAll: (params) => api.get('/api/property', { params }),
  getById: (id) => api.get(`/api/property/${id}`),
  create: (data) => api.post('/api/property', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/api/property/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/api/property/${id}`),
}

// Traveler API
export const travelerAPI = {
  getProfile: () => api.get('/api/traveler/profile'),
  updateProfile: (data) => api.put('/api/traveler/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getBookings: () => api.get('/api/traveler/bookings'),
  createBooking: (data) => api.post('/api/booking', data),
  getFavorites: () => api.get('/api/traveler/favorites'),
  addFavorite: (propertyId) => api.post(`/api/traveler/favorites/${propertyId}`),
  removeFavorite: (propertyId) => api.delete(`/api/traveler/favorites/${propertyId}`),
}

// Owner API
export const ownerAPI = {
  getProfile: () => api.get('/api/owner/profile'),
  updateProfile: (data) => api.put('/api/owner/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getBookings: () => api.get('/api/owner/bookings'),
  getBooking: (id) => api.get(`/api/owner/bookings/${id}`),
  acceptBooking: (id) => api.put(`/api/owner/bookings/${id}/accept`),
  cancelBooking: (id) => api.put(`/api/owner/bookings/${id}/cancel`),
  getDashboard: () => api.get('/api/owner/dashboard'),
}

// Booking API
export const bookingAPI = {
  getById: (id) => api.get(`/api/booking/${id}`),
}

export default api

