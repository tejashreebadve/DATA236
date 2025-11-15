import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPropertyById } from '../../store/slices/propertiesSlice'
import { createBooking } from '../../store/slices/bookingsSlice'
import { addFavorite, removeFavorite, fetchFavorites } from '../../store/slices/favoritesSlice'
import './Property.css'

const PropertyDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { selectedProperty, loading } = useSelector((state) => state.properties)
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { items: favorites } = useSelector((state) => state.favorites)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [guests, setGuests] = useState(1)
  const [isBooking, setIsBooking] = useState(false)

  const isFavorite = favorites.some((fav) => fav._id === selectedProperty?._id)

  useEffect(() => {
    dispatch(fetchPropertyById(id))
    if (isAuthenticated && user?.role === 'traveler') {
      dispatch(fetchFavorites())
    }
  }, [dispatch, id, isAuthenticated, user])

  const handleBooking = async (e) => {
    e.preventDefault()
    if (!isAuthenticated || user?.role !== 'traveler') {
      navigate('/login')
      return
    }

    setIsBooking(true)
    try {
      await dispatch(createBooking({
        propertyId: id,
        startDate,
        endDate,
        guests,
      })).unwrap()
      alert('Booking request created successfully!')
      navigate('/traveler/bookings')
    } catch (error) {
      alert(`Booking failed: ${error}`)
    } finally {
      setIsBooking(false)
    }
  }

  const handleFavorite = () => {
    if (!isAuthenticated || user?.role !== 'traveler') {
      navigate('/login')
      return
    }

    if (isFavorite) {
      dispatch(removeFavorite(selectedProperty._id))
    } else {
      dispatch(addFavorite(selectedProperty._id))
    }
  }

  if (loading) return <div className="loading">Loading property details...</div>
  if (!selectedProperty) return <div>Property not found</div>

  return (
    <div className="property-details">
      <div className="container">
        <div className="property-header">
          <h1>{selectedProperty.name}</h1>
          <p className="property-location">{selectedProperty.location}</p>
          {isAuthenticated && user?.role === 'traveler' && (
            <button onClick={handleFavorite} className="btn-favorite">
              {isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
            </button>
          )}
        </div>

        <div className="property-content">
          <div className="property-images">
            {selectedProperty.photos && selectedProperty.photos.length > 0 ? (
              selectedProperty.photos.map((photo, index) => (
                <img key={index} src={photo} alt={`${selectedProperty.name} - ${index + 1}`} />
              ))
            ) : (
              <div className="no-image">No images available</div>
            )}
          </div>

          <div className="property-info-section">
            <h2>About this property</h2>
            <p>{selectedProperty.description}</p>

            <div className="property-specs">
              <div className="spec">
                <strong>Type:</strong> {selectedProperty.type}
              </div>
              <div className="spec">
                <strong>Bedrooms:</strong> {selectedProperty.bedrooms}
              </div>
              <div className="spec">
                <strong>Bathrooms:</strong> {selectedProperty.bathrooms}
              </div>
              <div className="spec">
                <strong>Price:</strong> ${selectedProperty.pricing?.perNight || 0}/night
              </div>
            </div>

            {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
              <>
                <h3>Amenities</h3>
                <ul className="amenities-list">
                  {selectedProperty.amenities.map((amenity, index) => (
                    <li key={index}>{amenity}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {isAuthenticated && user?.role === 'traveler' && (
            <div className="booking-section">
              <h2>Book this property</h2>
              <form onSubmit={handleBooking}>
                <div className="form-group">
                  <label>Check-in</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Check-out</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    min={startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Guests</label>
                  <input
                    type="number"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    min="1"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isBooking}
                >
                  {isBooking ? 'Booking...' : 'Request to Book'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertyDetails

