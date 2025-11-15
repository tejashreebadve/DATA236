import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchBookings } from '../../store/slices/bookingsSlice'
import { fetchPropertyById } from '../../store/slices/propertiesSlice'
import { format } from 'date-fns'
import { getPropertyImageUrl } from '../../utils/imageUtils'
import './Booking.css'

const TravelerBookings = () => {
  const dispatch = useDispatch()
  const { items, loading } = useSelector((state) => state.bookings)
  const [propertyImages, setPropertyImages] = useState({})

  useEffect(() => {
    dispatch(fetchBookings('traveler'))
  }, [dispatch])

  // Fetch property images for each booking
  useEffect(() => {
    const fetchPropertyImages = async () => {
      const imageMap = {}
      const propertyIdsToFetch = new Set()

      // First, check which properties need fetching
      for (const booking of items) {
        if (!booking.propertyId) continue
        
        // If propertyId is an object (already populated), use it directly
        if (typeof booking.propertyId === 'object' && booking.propertyId._id) {
          const propId = booking.propertyId._id.toString()
          if (booking.propertyId.photos && booking.propertyId.photos.length > 0) {
            imageMap[propId] = getPropertyImageUrl(booking.propertyId.photos[0])
          } else {
            // Need to fetch if not already in our map
            if (!imageMap[propId] && !propertyImages[propId]) {
              propertyIdsToFetch.add(propId)
            }
          }
        } else if (typeof booking.propertyId === 'string') {
          const propId = booking.propertyId
          // Check if already in map or cached
          if (!imageMap[propId] && !propertyImages[propId]) {
            propertyIdsToFetch.add(propId)
          }
        }
      }

      // Fetch properties that need data
      for (const propertyId of Array.from(propertyIdsToFetch)) {
        try {
          // Skip if already cached
          if (propertyImages[propertyId]) {
            continue
          }
          const property = await dispatch(fetchPropertyById(propertyId)).unwrap()
          if (property?.photos && property.photos.length > 0) {
            imageMap[propertyId] = getPropertyImageUrl(property.photos[0])
          }
        } catch (error) {
          console.error(`Error fetching property ${propertyId}:`, error)
        }
      }

      // Update state if we have new images
      if (Object.keys(imageMap).length > 0) {
        setPropertyImages((prev) => {
          const updated = { ...prev, ...imageMap }
          return updated
        })
      }
    }

    if (items.length > 0) {
      fetchPropertyImages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, dispatch])

  const getPropertyImage = (booking) => {
    // Check if propertyId is populated object
    if (typeof booking.propertyId === 'object' && booking.propertyId.photos) {
      const photo = booking.propertyId.photos[0]
      return photo ? getPropertyImageUrl(photo) : null
    }
    // Check cached images (already converted to URLs in imageMap)
    const propertyId = typeof booking.propertyId === 'object' 
      ? booking.propertyId._id 
      : booking.propertyId
    return propertyImages[propertyId] || null
  }

  const getPropertyName = (booking) => {
    if (typeof booking.propertyId === 'object' && booking.propertyId.name) {
      return booking.propertyId.name
    }
    return booking.propertyId?.name || 'Property'
  }

  const getPropertyId = (booking) => {
    if (typeof booking.propertyId === 'object') {
      return booking.propertyId._id
    }
    return booking.propertyId
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
          <div className="no-bookings">No bookings yet. Start exploring properties!</div>
        ) : (
          <div className="bookings-list">
            {items.map((booking) => {
              const propertyImage = getPropertyImage(booking)
              const propertyName = getPropertyName(booking)
              const propertyId = getPropertyId(booking)
              
              return (
                <div key={booking._id} className="booking-card">
                  <div className="booking-content">
                    {propertyImage && (
                      <Link to={`/properties/${propertyId}`} className="booking-image">
                        <img src={propertyImage} alt={propertyName} />
                      </Link>
                    )}
                    <div className="booking-info">
                      <div className="booking-header">
                        <Link to={`/properties/${propertyId}`}>
                          <h3>{propertyName}</h3>
                        </Link>
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
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TravelerBookings

