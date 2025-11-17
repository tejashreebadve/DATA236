import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPropertyById } from '../../store/slices/propertiesSlice'
import { createBooking } from '../../store/slices/bookingsSlice'
import { addFavorite, removeFavorite, fetchFavorites } from '../../store/slices/favoritesSlice'
import { format } from 'date-fns'
import { getPropertyImageUrl } from '../../utils/imageUtils'
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [bookingError, setBookingError] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState(null)
  const [availabilityMessage, setAvailabilityMessage] = useState(null)

  const isFavorite = favorites.some((fav) => fav._id === selectedProperty?._id)

  // Calculate available dates and show message
  useEffect(() => {
    if (selectedProperty?.availability) {
      const avail = selectedProperty.availability
      if (avail.startDate && avail.endDate) {
        const start = new Date(avail.startDate)
        const end = new Date(avail.endDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Only show if availability window is in the future
        if (end >= today) {
          const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          setAvailabilityMessage(`Available from ${startStr} to ${endStr}`)
        } else {
          setAvailabilityMessage('This property is currently not available for booking')
        }
      } else {
        setAvailabilityMessage(null)
      }
    } else {
      setAvailabilityMessage(null)
    }
  }, [selectedProperty])

  useEffect(() => {
    dispatch(fetchPropertyById(id))
    if (isAuthenticated && user?.role === 'traveler') {
      dispatch(fetchFavorites())
    }
  }, [dispatch, id, isAuthenticated, user])

  // Check if dates are within availability window and not blocked
  const checkDateAvailability = (start, end) => {
    if (!selectedProperty?.availability) return { available: true }
    
    const avail = selectedProperty.availability
    const startDateObj = new Date(start)
    const endDateObj = new Date(end)
    
    // Check availability window
    if (avail.startDate && avail.endDate) {
      const availStart = new Date(avail.startDate)
      const availEnd = new Date(avail.endDate)
      
      if (startDateObj < availStart || endDateObj > availEnd) {
        return { available: false, reason: 'Selected dates are outside the available date range' }
      }
    }
    
    // Check blocked dates
    if (avail.blockedDates && avail.blockedDates.length > 0) {
      for (const block of avail.blockedDates) {
        const blockStart = new Date(block.startDate)
        const blockEnd = new Date(block.endDate)
        
        // Check if there's any overlap
        if (startDateObj <= blockEnd && endDateObj >= blockStart) {
          return { available: false, reason: 'Selected dates overlap with blocked dates' }
        }
      }
    }
    
    return { available: true }
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    setBookingError(null)
    setBookingSuccess(null)
    
    if (!isAuthenticated || user?.role !== 'traveler') {
      navigate('/login')
      return
    }

    if (!startDate || !endDate) {
      setBookingError('Please select check-in and check-out dates')
      return
    }

    // Check date availability
    const availabilityCheck = checkDateAvailability(startDate, endDate)
    if (!availabilityCheck.available) {
      setBookingError(availabilityCheck.reason || 'Property is not available for the selected dates')
      return
    }

    // Validate max guests
    if (selectedProperty.maxGuests && guests > selectedProperty.maxGuests) {
      setBookingError(`This property can accommodate a maximum of ${selectedProperty.maxGuests} guests. Please adjust the number of guests.`)
      return
    }

    // Calculate total price
    const checkIn = new Date(startDate)
    const checkOut = new Date(endDate)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    const perNight = selectedProperty.pricing?.perNight || selectedProperty.pricing?.basePrice || 0
    const totalPrice = nights * perNight

    setIsBooking(true)
    try {
      await dispatch(createBooking({
        propertyId: id,
        startDate,
        endDate,
        guests,
        totalPrice,
      })).unwrap()
      setBookingSuccess('Booking request created successfully! Redirecting...')
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/traveler/bookings')
      }, 2000)
    } catch (error) {
      setBookingError(error || 'Booking failed. Please try again.')
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

  const calculateTotal = () => {
    if (!startDate || !endDate || !selectedProperty?.pricing?.perNight) return 0
    const checkIn = new Date(startDate)
    const checkOut = new Date(endDate)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    return nights * selectedProperty.pricing.perNight
  }

  if (loading) return <div className="loading">Loading property details...</div>
  if (!selectedProperty) return <div className="no-property">Property not found</div>

  const photos = selectedProperty.photos || []
  const mainPhoto = photos[0] ? getPropertyImageUrl(photos[0]) : null
  const otherPhotos = photos.slice(1, 5).map(photo => getPropertyImageUrl(photo))

  // Check if owner is viewing their own property
  const isOwnerViewingOwnProperty = isAuthenticated && 
    user?.role === 'owner' && 
    selectedProperty?.ownerId && 
    (selectedProperty.ownerId._id === user.id || selectedProperty.ownerId === user.id)

  return (
    <div className="property-details-page">
      {isOwnerViewingOwnProperty && (
        <div className="container" style={{ marginBottom: '20px' }}>
          <button onClick={() => navigate('/owner/properties')} className="back-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to My Properties
          </button>
        </div>
      )}
      <div className="property-header-section">
        <div className="container">
          <div className="property-title-section">
            <h1>{selectedProperty.name}</h1>
            <div className="property-actions">
              {isOwnerViewingOwnProperty && (
                <Link to={`/owner/properties/${id}/edit`} className="btn btn-primary">
                  Edit Property
                </Link>
              )}
              {isAuthenticated && user?.role === 'traveler' && (
                <button
                  className={`save-button ${isFavorite ? 'saved' : ''}`}
                  onClick={handleFavorite}
                  aria-label="Favorite"
                >
                  <svg viewBox="0 0 32 32" fill={isFavorite ? 'currentColor' : 'none'}>
                    <path
                      d="M16 28C16 28 6 20 6 12C6 8.68629 8.68629 6 12 6C13.8135 6 15.5251 6.78964 16.71 8.07034C17.8949 6.78964 19.6065 6 21.42 6C24.7337 6 27.42 8.68629 27.42 12C27.42 20 16 28 16 28Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Favorite
                </button>
              )}
            </div>
          </div>
          <p className="property-location-text">
            {selectedProperty.location} · {selectedProperty.type}
          </p>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="property-images-section">
        <div className="container">
          {photos.length > 0 ? (
            <div className="image-gallery">
              <div className="main-image">
                <img src={mainPhoto} alt={selectedProperty.name} />
              </div>
              {otherPhotos.length > 0 && (
                <div className="thumbnail-images">
                  {otherPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className="thumbnail"
                      onClick={() => setSelectedImageIndex(index + 1)}
                    >
                      <img src={photo} alt={`${selectedProperty.name} - ${index + 2}`} />
                      {index === 3 && photos.length > 5 && (
                        <div className="show-all-overlay" onClick={() => setShowAllPhotos(true)}>
                          <span>Show all photos</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="no-images">
              <p>No images available</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="property-content-section">
        <div className="container">
          <div className="content-layout">
            {/* Left Side - Property Info */}
            <div className="property-info-content">
              <div className="property-highlights">
                <h2>
                  {selectedProperty.type} in {selectedProperty.location?.split(',')[0] || ''}
                </h2>
                <div className="property-specs">
                  <span>{selectedProperty.bedrooms || 0} bedrooms</span>
                  <span>·</span>
                  <span>{selectedProperty.bathrooms || 0} bathrooms</span>
                  {selectedProperty.maxGuests && (
                    <>
                      <span>·</span>
                      <span>Up to {selectedProperty.maxGuests} guests</span>
                    </>
                  )}
                </div>
              </div>

              <div className="property-description-section">
                <div className="description-header">
                  <h3>About this place</h3>
                </div>
                <p>{selectedProperty.description || 'No description available.'}</p>
              </div>

              {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                <div className="amenities-section">
                  <h3>What this place offers</h3>
                  <div className="amenities-grid">
                    {selectedProperty.amenities.map((amenity, index) => (
                      <div key={index} className="amenity-item">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Booking Widget - Hide for owners viewing their own property */}
            {!isOwnerViewingOwnProperty && (
            <div className="booking-widget-container">
              <div className="booking-widget">
                <div className="booking-price">
                  <span className="price-amount">${selectedProperty.pricing?.perNight || 0}</span>
                  <span className="price-period"> / night</span>
                </div>

                <form onSubmit={handleBooking} className="booking-form">
                  {availabilityMessage && (
                    <div className={`availability-message ${selectedProperty?.availability?.startDate && new Date(selectedProperty.availability.endDate) >= new Date() ? 'available' : 'unavailable'}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 7V3M16 7V3M3 11H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z" />
                      </svg>
                      {availabilityMessage}
                    </div>
                  )}
                  {bookingError && (
                    <div className="alert alert-error">
                      {bookingError}
                    </div>
                  )}
                  {bookingSuccess && (
                    <div className="alert alert-success">
                      {bookingSuccess}
                    </div>
                  )}
                  <div className="date-inputs">
                    <div className="date-input-group">
                      <label>CHECK-IN</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value)
                          setBookingError(null) // Clear error when user changes date
                          // If end date is before new start date, clear it
                          if (endDate && e.target.value && new Date(e.target.value) >= new Date(endDate)) {
                            setEndDate('')
                          }
                        }}
                        required
                        min={
                          selectedProperty?.availability?.startDate 
                            ? new Date(Math.max(new Date(), new Date(selectedProperty.availability.startDate))).toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0]
                        }
                        max={
                          selectedProperty?.availability?.endDate 
                            ? new Date(selectedProperty.availability.endDate).toISOString().split('T')[0]
                            : undefined
                        }
                      />
                    </div>
                    <div className="date-input-group">
                      <label>CHECKOUT</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value)
                          setBookingError(null) // Clear error when user changes date
                          // Validate dates when end date is selected
                          if (e.target.value && startDate) {
                            const check = checkDateAvailability(startDate, e.target.value)
                            if (!check.available) {
                              setBookingError(check.reason || 'Property is not available for the selected dates')
                            }
                          }
                        }}
                        required
                        min={
                          startDate 
                            ? startDate
                            : selectedProperty?.availability?.startDate 
                              ? new Date(Math.max(new Date(), new Date(selectedProperty.availability.startDate))).toISOString().split('T')[0]
                              : new Date().toISOString().split('T')[0]
                        }
                        max={
                          selectedProperty?.availability?.endDate 
                            ? new Date(selectedProperty.availability.endDate).toISOString().split('T')[0]
                            : undefined
                        }
                      />
                    </div>
                  </div>

                  <div className="guests-input-group">
                    <label>GUESTS</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                      required
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'guest' : 'guests'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="reserve-button" disabled={isBooking}>
                    {isBooking ? 'Processing...' : !isAuthenticated || user?.role !== 'traveler' ? 'Log in to Reserve' : 'Reserve'}
                  </button>

                  {startDate && endDate && calculateTotal() > 0 && (
                    <div className="booking-summary">
                      <div className="summary-row">
                        <span>
                          ${selectedProperty.pricing?.perNight || 0} x{' '}
                          {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))}{' '}
                          nights
                        </span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="summary-divider"></div>
                      <div className="summary-row total">
                        <span>Total</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <p className="booking-note">You won't be charged yet</p>
                </form>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyDetails
