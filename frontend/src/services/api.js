import axios from 'axios'

// Use empty baseURL or relative path so Vite proxy can handle routing
// In development, Vite proxy will route /api/* to appropriate services
// In production, set VITE_API_BASE_URL to your API gateway URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Log API configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    baseURL: API_BASE_URL || '(empty - using Vite proxy)',
    mode: import.meta.env.MODE,
  })
}

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL || ''}${config.url}`,
        hasToken: !!token,
      })
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        data: response.data,
      })
    }
    return response
  },
  (error) => {
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      })
    }

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      // But don't redirect if we're already on the login page (to avoid redirect loop)
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register'
      
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      // Only redirect if not already on auth pages
      if (!isLoginPage) {
        window.location.href = '/login'
      }
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
  getByOwner: (ownerId) => api.get(`/api/property/owner/${ownerId}`),
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
  uploadProfilePicture: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/api/traveler/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getBookings: () => api.get('/api/traveler/bookings'),
  createBooking: (data) => api.post('/api/booking', data), // Calls booking-service directly
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
  uploadProfilePicture: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/api/owner/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
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

