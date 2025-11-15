import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBookings } from '../../store/slices/bookingsSlice'
import { fetchPropertiesByOwner } from '../../store/slices/propertiesSlice'
import { getPropertyImageUrl } from '../../utils/imageUtils'
import './Dashboard.css'

const OwnerDashboard = () => {
  const dispatch = useDispatch()
  const { items: bookings } = useSelector((state) => state.bookings)
  const { items: properties, loading: propertiesLoading } = useSelector((state) => state.properties)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchBookings('owner'))
      dispatch(fetchPropertiesByOwner(user.id))
    }
  }, [dispatch, user?.id])

  const pendingBookings = useMemo(() => 
    bookings.filter((b) => b.status === 'pending'),
    [bookings]
  )

  const acceptedBookings = useMemo(() => 
    bookings.filter((b) => b.status === 'accepted'),
    [bookings]
  )

  // Calculate total revenue (predicted) from pending + accepted bookings
  const totalRevenue = useMemo(() => {
    const allBookings = [...pendingBookings, ...acceptedBookings]
    return allBookings.reduce((total, booking) => {
      // Calculate nights
      const startDate = new Date(booking.startDate)
      const endDate = new Date(booking.endDate)
      const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      
      // Get price per night from property or booking
      const pricePerNight = booking.totalPrice 
        ? booking.totalPrice / nights 
        : (booking.propertyId?.pricing?.basePrice || booking.propertyId?.pricing?.perNight || 0)
      
      return total + (pricePerNight * nights)
    }, 0)
  }, [pendingBookings, acceptedBookings])

  if (propertiesLoading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Owner Dashboard</h1>
          <p className="dashboard-subtitle">Manage your properties and bookings</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h3>Total Properties</h3>
            <p className="stat-number">{properties.length}</p>
            <Link to="/owner/properties" className="stat-link">
              View All →
            </Link>
          </div>

          <div className="stat-card stat-card-pending">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>Pending Bookings</h3>
            <p className="stat-number">{pendingBookings.length}</p>
            <Link to="/owner/bookings" className="stat-link">
              Manage →
            </Link>
          </div>

          <div className="stat-card stat-card-accepted">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3>Accepted Bookings</h3>
            <p className="stat-number">{acceptedBookings.length}</p>
            <Link to="/owner/bookings?status=accepted" className="stat-link">
              View All →
            </Link>
          </div>

          <div className="stat-card stat-card-revenue">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3>Total Revenue (Predicted)</h3>
            <p className="stat-number">${totalRevenue.toFixed(2)}</p>
            <span className="stat-note">From pending & accepted bookings</span>
          </div>
        </div>

        {pendingBookings.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Pending Booking Requests</h2>
              <Link to="/owner/bookings" className="view-all-link">
                View all →
              </Link>
            </div>
            <div className="bookings-preview">
              {pendingBookings.slice(0, 5).map((booking) => (
                <div key={booking._id} className="booking-preview-card">
                  <div className="booking-card-header">
                    <h4>{booking.propertyId?.name || 'Property'}</h4>
                    <span className="booking-status-badge pending">Pending</span>
                  </div>
                  <div className="booking-card-details">
                    <p>
                      <strong>Traveler:</strong> {booking.travelerId?.name || 'Unknown'}
                    </p>
                    <p>
                      <strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} -{' '}
                      {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Guests:</strong> {booking.guests || 'N/A'}
                    </p>
                    {booking.totalPrice && (
                      <p>
                        <strong>Total:</strong> ${booking.totalPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Link to="/owner/bookings" className="btn btn-primary btn-sm">
                    Review
                  </Link>
                </div>
              ))}
            </div>
            {pendingBookings.length > 5 && (
              <div className="view-all-footer">
                <Link to="/owner/bookings" className="view-all-link">
                  View all {pendingBookings.length} pending bookings →
                </Link>
              </div>
            )}
          </div>
        )}

        {properties.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Your Properties</h2>
              <Link to="/owner/properties/create" className="view-all-link">
                Add New →
              </Link>
            </div>
            <div className="properties-grid">
              {properties.slice(0, 6).map((property) => (
                <Link
                  key={property._id}
                  to={`/properties/${property._id}`}
                  className="property-card-mini"
                >
                  {property.photos && property.photos.length > 0 ? (
                    <img
                      src={getPropertyImageUrl(property.photos[0])}
                      alt={property.name}
                      className="property-image-mini"
                    />
                  ) : (
                    <div className="property-image-placeholder-mini">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  <div className="property-info-mini">
                    <h4>{property.name}</h4>
                    <p className="property-location-mini">{property.location}</p>
                    <p className="property-price-mini">
                      ${property.pricing?.perNight || property.pricing?.basePrice || 0}/night
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            {properties.length > 6 && (
              <div className="view-all-footer">
                <Link to="/owner/properties/create" className="view-all-link">
                  View all {properties.length} properties →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerDashboard
