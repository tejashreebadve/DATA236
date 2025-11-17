import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Layout from './components/Layout/Layout'
import { TripMateButton, TripMatePanel } from './components/TripMate'
import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import PropertySearch from './pages/Property/PropertySearch'
import PropertyDetails from './pages/Property/PropertyDetails'
import TravelerProfile from './pages/Profile/TravelerProfile'
import OwnerProfile from './pages/Profile/OwnerProfile'
import TravelerBookings from './pages/Booking/TravelerBookings'
import OwnerBookings from './pages/Booking/OwnerBookings'
import Favorites from './pages/Favorites/Favorites'
import OwnerDashboard from './pages/Dashboard/OwnerDashboard'
import CreateProperty from './pages/Property/CreateProperty'
import EditProperty from './pages/Property/EditProperty'
import OwnerProperties from './pages/Property/OwnerProperties'

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { user } = useSelector((state) => state.auth)
  
  return (
    <Layout>
      {/* TripMate AI Assistant - Show on traveler pages or for non-logged-in users */}
      {(user?.role === 'traveler' || !user) && (
        <>
          <TripMateButton />
          <TripMatePanel />
        </>
      )}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<PropertySearch />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Traveler Routes */}
        <Route
          path="/traveler/profile"
          element={
            <ProtectedRoute requiredRole="traveler">
              <TravelerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/traveler/bookings"
          element={
            <ProtectedRoute requiredRole="traveler">
              <TravelerBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/traveler/favorites"
          element={
            <ProtectedRoute requiredRole="traveler">
              <Favorites />
            </ProtectedRoute>
          }
        />

        {/* Protected Owner Routes */}
        <Route
          path="/owner/profile"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/bookings"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/properties"
          element={
            <ProtectedRoute requiredRole="owner">
              <OwnerProperties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/properties/create"
          element={
            <ProtectedRoute requiredRole="owner">
              <CreateProperty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/properties/:id/edit"
          element={
            <ProtectedRoute requiredRole="owner">
              <EditProperty />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App

