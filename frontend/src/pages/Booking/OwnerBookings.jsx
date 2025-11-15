import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { fetchBookings, acceptBooking, cancelBooking } from '../../store/slices/bookingsSlice'
import { format } from 'date-fns'
import { getPropertyImageUrl } from '../../utils/imageUtils'
import './Booking.css'

const OwnerBookings = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { items, loading } = useSelector((state) => state.bookings)

  // Get status filter from URL params
  const statusFilter = searchParams.get('status') || 'all'

  useEffect(() => {
    dispatch(fetchBookings('owner'))
  }, [dispatch])

  // Filter bookings based on status
  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') {
      return items
    }
    return items.filter((booking) => booking.status === statusFilter)
  }, [items, statusFilter])

  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const handleAccept = async (id) => {
    setSuccessMessage(null)
    setErrorMessage(null)
    try {
      await dispatch(acceptBooking(id)).unwrap()
      setSuccessMessage('Booking accepted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage(error || 'Failed to accept booking')
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }

  const handleCancel = async (id) => {
    setSuccessMessage(null)
    setErrorMessage(null)
    try {
      await dispatch(cancelBooking(id)).unwrap()
      setSuccessMessage('Booking cancelled successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage(error || 'Failed to cancel booking')
      setTimeout(() => setErrorMessage(null), 5000)
    }
  }

  if (loading) return <div className="loading">Loading bookings...</div>

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'green'
      case 'pending':
        return 'orange'
      case 'cancelled':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <div className="bookings-page">
      <div className="container">
        <div className="bookings-page-header">
          <button onClick={() => navigate('/owner/dashboard')} className="back-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="header-content">
            <h1>My Bookings</h1>
            <div className="status-filters">
              <button
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => navigate('/owner/bookings')}
              >
                All
              </button>
              <button
                className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => navigate('/owner/bookings?status=pending')}
              >
                Pending
              </button>
              <button
                className={`filter-btn ${statusFilter === 'accepted' ? 'active' : ''}`}
                onClick={() => navigate('/owner/bookings?status=accepted')}
              >
                Accepted
              </button>
              <button
                className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
                onClick={() => navigate('/owner/bookings?status=cancelled')}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-error">
            {errorMessage}
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div className="no-bookings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <h2>No {statusFilter !== 'all' ? statusFilter : ''} bookings yet</h2>
            <p>
              {statusFilter === 'pending' && 'You don\'t have any pending booking requests.'}
              {statusFilter === 'accepted' && 'You don\'t have any accepted bookings.'}
              {statusFilter === 'cancelled' && 'You don\'t have any cancelled bookings.'}
              {statusFilter === 'all' && 'You don\'t have any bookings yet.'}
            </p>
          </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-card-content">
                  {booking.propertyId?.photos && booking.propertyId.photos.length > 0 && (
                    <div className="booking-property-image">
                      <img
                        src={getPropertyImageUrl(booking.propertyId.photos[0])}
                        alt={booking.propertyId?.name || 'Property'}
                      />
                    </div>
                  )}
                  <div className="booking-info-section">
                    <div className="booking-header">
                      <div>
                        <h3>
                          <Link to={`/properties/${booking.propertyId?._id || booking.propertyId}`}>
                            {booking.propertyId?.name || 'Property'}
                          </Link>
                        </h3>
                        {booking.propertyId?.location && (
                          <p className="booking-property-location">{booking.propertyId.location}</p>
                        )}
                      </div>
                      <span className={`status status-${getStatusColor(booking.status)}`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="booking-details">
                      <p>
                        <strong>Traveler:</strong> {
                          (() => {
                            // Handle populated object
                            if (typeof booking.travelerId === 'object' && booking.travelerId !== null) {
                              // Check if it has _id (populated) or is just an ID string
                              if (booking.travelerId._id || booking.travelerId.name || booking.travelerId.email) {
                                return booking.travelerId.name || booking.travelerId.email || 'Unknown';
                              }
                            }
                            // If it's a string ID, we can't get the name without fetching
                            console.warn('Traveler not populated:', booking.travelerId);
                            return 'Unknown';
                          })()
                        }
                      </p>
                  <p>
                    <strong>Check-in:</strong>{' '}
                    {booking.startDate
                      ? format(new Date(booking.startDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                  <p>
                    <strong>Check-out:</strong>{' '}
                    {booking.endDate
                      ? format(new Date(booking.endDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                  <p>
                    <strong>Guests:</strong> {booking.guests}
                  </p>
                      <p>
                        <strong>Total:</strong> ${booking.totalPrice ? booking.totalPrice.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    {booking.status === 'pending' && (
                      <div className="booking-actions">
                        <button
                          onClick={() => handleAccept(booking._id)}
                          className="btn btn-primary"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleCancel(booking._id)}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerBookings

