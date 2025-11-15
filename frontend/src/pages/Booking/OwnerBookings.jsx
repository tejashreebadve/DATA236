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

  // Debug: Log bookings data
  console.log('OwnerBookings - items:', items);
  console.log('OwnerBookings - filteredBookings:', filteredBookings);

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
            {filteredBookings.map((booking) => {
              try {
                // Debug logging for cancelled bookings
                if (booking.status === 'cancelled') {
                  console.log('🔴 Cancelled booking data:', {
                    bookingId: booking._id,
                    travelerId: booking.travelerId,
                    travelerIdType: typeof booking.travelerId,
                    propertyId: booking.propertyId,
                    propertyIdType: typeof booking.propertyId,
                    fullBooking: booking
                  });
                }

                // Safely extract property data
                // Handle both populated objects and ObjectId strings
                let property = null;
                if (typeof booking.propertyId === 'object' && booking.propertyId !== null) {
                  // Check if it's a populated object (has _id or name property)
                  if (booking.propertyId._id || booking.propertyId.name || booking.propertyId.photos) {
                    property = booking.propertyId;
                  }
                }
                
                // If property is not populated but we have an ID, we'll show placeholder
                const propertyId = property?._id || (typeof booking.propertyId === 'string' ? booking.propertyId : booking.propertyId?._id || booking.propertyId) || '';
                const propertyName = property?.name || 'Property';
                // Handle location - could be string or object
                const propertyLocation = typeof property?.location === 'string' 
                  ? property.location 
                  : property?.location?.address 
                    ? `${property.location.address}, ${property.location.city}, ${property.location.state}, ${property.location.country}`
                    : null;
                const propertyPhoto = property?.photos?.[0];

                // Safely extract traveler data
                // Handle both populated objects and ObjectId strings
                let traveler = null;
                if (typeof booking.travelerId === 'object' && booking.travelerId !== null) {
                  // Check if it's a populated object (has _id, name, or email property)
                  if (booking.travelerId._id || booking.travelerId.name || booking.travelerId.email) {
                    traveler = booking.travelerId;
                  }
                }
                
                const travelerName = traveler?.name || traveler?.email || 'Unknown';
                
                // Debug logging for cancelled bookings
                if (booking.status === 'cancelled') {
                  console.log('🔴 Cancelled booking debug:', {
                    rawTravelerId: booking.travelerId,
                    travelerIdType: typeof booking.travelerId,
                    parsedTraveler: traveler,
                    travelerName,
                    rawPropertyId: booking.propertyId,
                    propertyIdType: typeof booking.propertyId,
                    parsedProperty: property,
                    propertyName,
                    propertyPhoto
                  });
                }

                return (
              <div key={booking._id} className="booking-card">
                <div className="booking-card-content">
                  {propertyPhoto && (
                    <div className="booking-property-image">
                      <img
                        src={getPropertyImageUrl(propertyPhoto)}
                        alt={propertyName}
                      />
                    </div>
                  )}
                  <div className="booking-info-section">
                    <div className="booking-header">
                      <div>
                        <h3>
                          <Link to={`/properties/${propertyId}`}>
                            {propertyName}
                          </Link>
                        </h3>
                        {propertyLocation && (
                          <p className="booking-property-location">{propertyLocation}</p>
                        )}
                      </div>
                      <span className={`status status-${getStatusColor(booking.status)}`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="booking-details">
                      <p>
                        <strong>Traveler:</strong> {travelerName}
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
              );
              } catch (error) {
                console.error('Error rendering booking card:', error, booking);
                return (
                  <div key={booking._id} className="booking-card">
                    <div className="booking-card-content">
                      <p>Error loading booking: {error.message}</p>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerBookings

