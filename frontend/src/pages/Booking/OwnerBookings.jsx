import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBookings, acceptBooking, cancelBooking } from '../../store/slices/bookingsSlice'
import { format } from 'date-fns'
import './Booking.css'

const OwnerBookings = () => {
  const dispatch = useDispatch()
  const { items, loading } = useSelector((state) => state.bookings)

  useEffect(() => {
    dispatch(fetchBookings('owner'))
  }, [dispatch])

  const handleAccept = async (id) => {
    if (window.confirm('Are you sure you want to accept this booking?')) {
      try {
        await dispatch(acceptBooking(id)).unwrap()
        alert('Booking accepted!')
      } catch (error) {
        alert(`Failed to accept booking: ${error}`)
      }
    }
  }

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await dispatch(cancelBooking(id)).unwrap()
        alert('Booking cancelled!')
      } catch (error) {
        alert(`Failed to cancel booking: ${error}`)
      }
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
        <h1>My Bookings</h1>

        {items.length === 0 ? (
          <div className="no-bookings">No bookings yet.</div>
        ) : (
          <div className="bookings-list">
            {items.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-header">
                  <h3>{booking.propertyId?.name || 'Property'}</h3>
                  <span className={`status status-${getStatusColor(booking.status)}`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>
                <div className="booking-details">
                  <p>
                    <strong>Traveler:</strong> {booking.travelerId?.name || 'Unknown'}
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
                    <strong>Total:</strong> ${booking.totalPrice || 0}
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerBookings

