import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBookings } from '../../store/slices/bookingsSlice'
import { fetchProperties } from '../../store/slices/propertiesSlice'
import './Dashboard.css'

const OwnerDashboard = () => {
  const dispatch = useDispatch()
  const { items: bookings } = useSelector((state) => state.bookings)
  const { items: properties } = useSelector((state) => state.properties)

  useEffect(() => {
    dispatch(fetchBookings('owner'))
    dispatch(fetchProperties())
  }, [dispatch])

  const pendingBookings = bookings.filter((b) => b.status === 'pending')
  const acceptedBookings = bookings.filter((b) => b.status === 'accepted')

  return (
    <div className="dashboard-page">
      <div className="container">
        <h1>Owner Dashboard</h1>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Properties</h3>
            <p className="stat-number">{properties.length}</p>
            <Link to="/properties" className="stat-link">
              View All →
            </Link>
          </div>
          <div className="stat-card">
            <h3>Pending Bookings</h3>
            <p className="stat-number">{pendingBookings.length}</p>
            <Link to="/owner/bookings" className="stat-link">
              Manage →
            </Link>
          </div>
          <div className="stat-card">
            <h3>Accepted Bookings</h3>
            <p className="stat-number">{acceptedBookings.length}</p>
            <Link to="/owner/bookings" className="stat-link">
              View All →
            </Link>
          </div>
        </div>

        <div className="dashboard-actions">
          <Link to="/owner/properties/create" className="btn btn-primary">
            List New Property
          </Link>
          <Link to="/owner/bookings" className="btn btn-secondary">
            Manage Bookings
          </Link>
          <Link to="/owner/profile" className="btn btn-outline">
            Edit Profile
          </Link>
        </div>

        {pendingBookings.length > 0 && (
          <div className="dashboard-section">
            <h2>Pending Booking Requests</h2>
            <div className="bookings-preview">
              {pendingBookings.slice(0, 5).map((booking) => (
                <div key={booking._id} className="booking-preview-card">
                  <h4>{booking.propertyId?.name || 'Property'}</h4>
                  <p>
                    <strong>Traveler:</strong> {booking.travelerId?.name || 'Unknown'}
                  </p>
                  <p>
                    <strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} -{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                  <Link to="/owner/bookings" className="btn btn-primary btn-sm">
                    Review
                  </Link>
                </div>
              ))}
            </div>
            {pendingBookings.length > 5 && (
              <Link to="/owner/bookings" className="view-all-link">
                View all {pendingBookings.length} pending bookings →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerDashboard

