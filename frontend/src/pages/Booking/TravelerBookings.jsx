import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBookings } from '../../store/slices/bookingsSlice'
import { format } from 'date-fns'
import './Booking.css'

const TravelerBookings = () => {
  const dispatch = useDispatch()
  const { items, loading } = useSelector((state) => state.bookings)

  useEffect(() => {
    dispatch(fetchBookings('traveler'))
  }, [dispatch])

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
          <div className="no-bookings">No bookings yet. Start exploring properties!</div>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TravelerBookings

