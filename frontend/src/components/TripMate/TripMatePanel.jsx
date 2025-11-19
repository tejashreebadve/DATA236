import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  closePanel, 
  selectBooking, 
  chatWithAgent, 
  generateItinerary,
  fetchTravelerBookings,
  clearChat,
  clearItinerary
} from '../../store/slices/aiAgentSlice'
import { fetchProfile } from '../../store/slices/profileSlice'
import { getPropertyImageUrl } from '../../utils/imageUtils'
import './TripMate.css'

const TripMatePanel = () => {
  const dispatch = useDispatch()
  const { isOpen, selectedBookingId, chatMessages, chatLoading, itinerary, itineraryLoading, itineraryError, bookings, bookingsLoading, bookingsError } = useSelector((state) => state.aiAgent)
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { traveler } = useSelector((state) => state.profile)
  
  const [message, setMessage] = useState('')
  const [showTripSelection, setShowTripSelection] = useState(false)
  const [itineraryPreferences, setItineraryPreferences] = useState('')
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const chatInputRef = useRef(null)

  // Fetch profile and bookings when panel opens for logged-in travelers
  useEffect(() => {
    if (isOpen && isAuthenticated && user?.role === 'traveler') {
      const fetchBookings = async () => {
        try {
          setError(null)
          let travelerId = traveler?._id || user?.userId
          
          // If no traveler ID available, fetch profile first
          if (!travelerId) {
            try {
              const profileResult = await dispatch(fetchProfile('traveler'))
              if (profileResult.type === 'profile/fetch/fulfilled') {
                travelerId = profileResult.payload.profile._id || profileResult.payload.profile.id
              }
            } catch (profileError) {
              console.error('Error fetching profile:', profileError)
            }
          }
          
          // Use userId as fallback if still no ID
          if (!travelerId) {
            travelerId = user?.userId
          }
          
          if (travelerId) {
            await dispatch(fetchTravelerBookings(travelerId))
            setShowTripSelection(true)
          } else {
            console.error('Could not determine traveler ID')
            setShowTripSelection(true) // Still show selection, but with empty state
          }
        } catch (error) {
          console.error('Error fetching bookings:', error)
          setError(error.message || 'Failed to load trips')
          setShowTripSelection(true) // Still show selection, but with error state
        }
      }
      
      fetchBookings()
    } else if (isOpen && !isAuthenticated) {
      setShowTripSelection(false)
    }
  }, [isOpen, isAuthenticated, user?.role, user?.userId, traveler?._id, dispatch])

  // Scroll to bottom when new messages arrive or when loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [chatMessages, chatLoading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !showTripSelection) {
      setTimeout(() => {
        chatInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, showTripSelection])

  const handleClose = () => {
    dispatch(closePanel())
    setMessage('')
    setItineraryPreferences('')
    setShowTripSelection(false)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || chatLoading) return

    const messageToSend = message.trim()
    setMessage('')

    try {
      const result = await dispatch(chatWithAgent({ message: messageToSend, context: null }))
      // Log for debugging
      if (result.type === 'aiAgent/chat/fulfilled') {
        console.log('Chat response received:', result.payload)
      } else if (result.type === 'aiAgent/chat/rejected') {
        console.error('Chat error:', result.payload)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleSelectTrip = (bookingId) => {
    try {
      dispatch(selectBooking(bookingId))
      setShowTripSelection(false)
      dispatch(clearItinerary())
    } catch (error) {
      console.error('Error selecting trip:', error)
    }
  }

  const handleGenerateItinerary = async () => {
    if (!selectedBookingId || !itineraryPreferences.trim()) {
      alert('Please select a trip and provide your preferences')
      return
    }

    try {
      const result = await dispatch(generateItinerary({
        bookingId: selectedBookingId,
        preferences: {
          naturalLanguageInput: itineraryPreferences.trim(),
        },
      }))
      console.log('✅ Itinerary generation result:', result)
      if (result.type === 'aiAgent/generateItinerary/fulfilled') {
        console.log('✅ Itinerary payload:', result.payload)
      } else if (result.type === 'aiAgent/generateItinerary/rejected') {
        console.error('❌ Itinerary generation failed:', result.error)
      }
    } catch (error) {
      console.error('Error generating itinerary:', error)
    }
  }

  // Ensure bookings is an array
  const bookingsArray = Array.isArray(bookings) ? bookings : []
  const selectedBooking = bookingsArray.find(b => (b._id === selectedBookingId) || (b.id === selectedBookingId))
  const property = selectedBooking?.propertyId || selectedBooking?.property

  if (!isOpen) return null

  return (
    <div className="trip-mate-overlay" onClick={handleClose}>
      <div className="trip-mate-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="trip-mate-header">
          <div className="trip-mate-header-content">
            <h2>🤖 TripMate</h2>
            <p className="trip-mate-subtitle">Your AI Travel Assistant</p>
          </div>
          <button className="trip-mate-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Content */}
        <div className="trip-mate-content">
          {/* Trip Selection (for logged-in travelers) */}
          {showTripSelection && isAuthenticated && user?.role === 'traveler' && (
            <div className="trip-mate-trip-selection">
              <h3>Select Your Trip</h3>
              {bookingsLoading ? (
                <p>Loading your trips...</p>
              ) : bookingsError ? (
                <div className="trip-mate-empty-state">
                  <p>Error loading trips: {bookingsError}</p>
                  <p className="trip-mate-empty-hint">You can still ask general travel questions below!</p>
                </div>
              ) : !bookingsArray || bookingsArray.length === 0 ? (
                <div className="trip-mate-empty-state">
                  <p>No upcoming trips found.</p>
                  <p className="trip-mate-empty-hint">You can still ask general travel questions below!</p>
                </div>
              ) : (
                <div className="trip-mate-bookings-list">
                  {bookingsArray.map((booking) => {
                    try {
                      const prop = booking.propertyId || booking.property
                      const location = typeof prop?.location === 'string' 
                        ? prop.location 
                        : prop?.location
                          ? `${prop.location.city || ''}, ${prop.location.country || ''}`.trim() || 'Location not available'
                          : 'Location not available'
                      
                      return (
                        <div
                          key={booking._id || booking.id}
                          className={`trip-mate-booking-card ${selectedBookingId === booking._id ? 'selected' : ''}`}
                          onClick={() => handleSelectTrip(booking._id || booking.id)}
                        >
                          {prop?.photos?.[0] && (
                            <img
                              src={getPropertyImageUrl(prop.photos[0])}
                              alt={prop?.name || 'Property'}
                              className="trip-mate-booking-image"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          )}
                          <div className="trip-mate-booking-info">
                            <h4>{prop?.name || 'Property'}</h4>
                            <p className="trip-mate-booking-location">{location}</p>
                            <p className="trip-mate-booking-dates">
                              {booking.startDate 
                                ? `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`
                                : 'Dates not available'}
                            </p>
                            <span className={`trip-mate-booking-status ${booking.status || 'pending'}`}>
                              {booking.status || 'pending'}
                            </span>
                          </div>
                        </div>
                      )
                    } catch (error) {
                      console.error('Error rendering booking:', error, booking)
                      return null
                    }
                  })}
                </div>
              )}
            </div>
          )}

          {/* Itinerary Generation (when trip selected) */}
          {selectedBookingId && selectedBooking && (
            <div className="trip-mate-itinerary-section">
              <h3>Plan Your Trip</h3>
              <div className="trip-mate-selected-trip">
                <p><strong>{property?.name || 'Property'}</strong></p>
                <p>
                  {selectedBooking.startDate && selectedBooking.endDate
                    ? `${new Date(selectedBooking.startDate).toLocaleDateString()} - ${new Date(selectedBooking.endDate).toLocaleDateString()}`
                    : 'Dates not available'}
                </p>
              </div>
              
              <textarea
                className="trip-mate-preferences-input"
                placeholder="Tell us about your preferences... (e.g., 'We want a family trip, we like adventure, we want luxury trip')"
                value={itineraryPreferences}
                onChange={(e) => setItineraryPreferences(e.target.value)}
                rows={4}
              />
              
              <button
                className="trip-mate-generate-btn"
                onClick={handleGenerateItinerary}
                disabled={itineraryLoading || !itineraryPreferences.trim()}
              >
                {itineraryLoading ? 'Generating...' : 'Generate Itinerary'}
              </button>

              {itineraryLoading && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  Generating your personalized itinerary...
                </div>
              )}

              {itineraryError && (
                <div className="trip-mate-error" style={{ color: 'red', padding: '10px', margin: '10px 0', background: '#ffe6e6', borderRadius: '4px' }}>
                  <strong>Error:</strong> {itineraryError}
                </div>
              )}
              
              {itinerary && !itineraryLoading && (
                <div className="trip-mate-itinerary-display">
                  <h4>Your Itinerary</h4>
                  {(() => {
                    console.log('🔍 Rendering itinerary:', itinerary)
                    console.log('🔍 Itinerary structure:', {
                      hasItinerary: !!itinerary.itinerary,
                      hasDays: !!itinerary.days,
                      hasItineraryDays: !!itinerary.itinerary?.days,
                      daysLength: itinerary.days?.length || itinerary.itinerary?.days?.length || 0,
                      fullStructure: JSON.stringify(itinerary, null, 2)
                    })
                    return null
                  })()}
                  
                  {/* Debug: Always show raw data for troubleshooting */}
                  <details style={{ marginBottom: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <summary style={{ cursor: 'pointer', color: '#666', fontSize: '14px' }}>🔍 Debug: View raw itinerary data</summary>
                    <pre style={{ background: '#fff', padding: '10px', marginTop: '10px', overflow: 'auto', fontSize: '11px', maxHeight: '300px', border: '1px solid #ddd' }}>
                      {JSON.stringify(itinerary, null, 2)}
                    </pre>
                  </details>
                  
                  {/* Debug: Show raw itinerary if empty */}
                  {(!itinerary.itinerary?.days?.length && !itinerary.days?.length && 
                    !itinerary.itinerary?.restaurants?.length && !itinerary.restaurants?.length &&
                    !itinerary.itinerary?.packingChecklist?.length && !itinerary.packingChecklist?.length) && (
                    <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', margin: '10px 0', border: '2px solid #ffc107' }}>
                      <p><strong>⚠️ Itinerary received but appears empty.</strong></p>
                      <p style={{ fontSize: '14px', color: '#856404', marginTop: '10px' }}>
                        The API returned data, but no days, restaurants, or packing checklist were found. 
                        Check the debug section above to see the actual data structure.
                      </p>
                    </div>
                  )}
                  
                  {/* Days - handle both itinerary.itinerary.days and itinerary.days */}
                  {((itinerary.itinerary?.days && itinerary.itinerary.days.length > 0) || 
                    (itinerary.days && itinerary.days.length > 0)) && (
                    <div className="itinerary-days">
                      {(itinerary.itinerary?.days || itinerary.days || []).map((day, dayIndex) => (
                        <div key={dayIndex} className="itinerary-day-card">
                          <div className="day-header">
                            <h5>Day {dayIndex + 1}</h5>
                            <span className="day-date">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                          </div>
                          
                          {/* Morning */}
                          {day.morning && day.morning.activities && day.morning.activities.length > 0 && (
                            <div className="time-block-card">
                              <h6 className="time-label">🌅 Morning</h6>
                              {day.morning.activities.map((activity, actIndex) => (
                                <div key={actIndex} className="activity-card">
                                  <div className="activity-header">
                                    <div className="activity-title">{activity.title}</div>
                                    <span className={`price-badge ${activity.priceTier}`}>{activity.priceTier}</span>
                                  </div>
                                  <p className="activity-address">📍 {activity.address}</p>
                                  <p className="activity-duration">⏱️ {activity.duration}</p>
                                  {activity.description && <p className="activity-description">{activity.description}</p>}
                                  {activity.tags && activity.tags.length > 0 && (
                                    <div className="activity-tags">
                                      {activity.tags.map((tag, tagIndex) => (
                                        <span key={tagIndex} className="tag">{tag}</span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="activity-features">
                                    {activity.wheelchairAccessible && <span className="feature-badge">♿ Accessible</span>}
                                    {activity.childFriendly && <span className="feature-badge">👶 Family-friendly</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Afternoon */}
                          {day.afternoon && day.afternoon.activities && day.afternoon.activities.length > 0 && (
                            <div className="time-block-card">
                              <h6 className="time-label">☀️ Afternoon</h6>
                              {day.afternoon.activities.map((activity, actIndex) => (
                                <div key={actIndex} className="activity-card">
                                  <div className="activity-header">
                                    <div className="activity-title">{activity.title}</div>
                                    <span className={`price-badge ${activity.priceTier}`}>{activity.priceTier}</span>
                                  </div>
                                  <p className="activity-address">📍 {activity.address}</p>
                                  <p className="activity-duration">⏱️ {activity.duration}</p>
                                  {activity.description && <p className="activity-description">{activity.description}</p>}
                                  {activity.tags && activity.tags.length > 0 && (
                                    <div className="activity-tags">
                                      {activity.tags.map((tag, tagIndex) => (
                                        <span key={tagIndex} className="tag">{tag}</span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="activity-features">
                                    {activity.wheelchairAccessible && <span className="feature-badge">♿ Accessible</span>}
                                    {activity.childFriendly && <span className="feature-badge">👶 Family-friendly</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Evening */}
                          {day.evening && day.evening.activities && day.evening.activities.length > 0 && (
                            <div className="time-block-card">
                              <h6 className="time-label">🌙 Evening</h6>
                              {day.evening.activities.map((activity, actIndex) => (
                                <div key={actIndex} className="activity-card">
                                  <div className="activity-header">
                                    <div className="activity-title">{activity.title}</div>
                                    <span className={`price-badge ${activity.priceTier}`}>{activity.priceTier}</span>
                                  </div>
                                  <p className="activity-address">📍 {activity.address}</p>
                                  <p className="activity-duration">⏱️ {activity.duration}</p>
                                  {activity.description && <p className="activity-description">{activity.description}</p>}
                                  {activity.tags && activity.tags.length > 0 && (
                                    <div className="activity-tags">
                                      {activity.tags.map((tag, tagIndex) => (
                                        <span key={tagIndex} className="tag">{tag}</span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="activity-features">
                                    {activity.wheelchairAccessible && <span className="feature-badge">♿ Accessible</span>}
                                    {activity.childFriendly && <span className="feature-badge">👶 Family-friendly</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Restaurants */}
                  {((itinerary.itinerary?.restaurants && itinerary.itinerary.restaurants.length > 0) ||
                    (itinerary.restaurants && itinerary.restaurants.length > 0)) && (
                    <div className="itinerary-restaurants">
                      <h5 className="section-title">🍽️ Restaurant Recommendations</h5>
                      {(itinerary.itinerary?.restaurants || itinerary.restaurants || []).map((restaurant, restIndex) => (
                        <div key={restIndex} className="restaurant-card">
                          <div className="restaurant-header">
                            <h6 className="restaurant-name">{restaurant.name}</h6>
                            {restaurant.rating && <span className="restaurant-rating">⭐ {restaurant.rating}</span>}
                          </div>
                          <p className="restaurant-cuisine">{restaurant.cuisine} • <span className={`price-badge ${restaurant.priceTier}`}>{restaurant.priceTier}</span></p>
                          <p className="restaurant-address">📍 {restaurant.address}</p>
                          {restaurant.description && <p className="restaurant-description">{restaurant.description}</p>}
                          {restaurant.dietaryOptions && restaurant.dietaryOptions.length > 0 && (
                            <div className="dietary-options">
                              <strong>Dietary options:</strong> {restaurant.dietaryOptions.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Packing Checklist */}
                  {((itinerary.itinerary?.packingChecklist && itinerary.itinerary.packingChecklist.length > 0) ||
                    (itinerary.packingChecklist && itinerary.packingChecklist.length > 0)) && (
                    <div className="itinerary-packing">
                      <h5 className="section-title">🧳 Packing Checklist</h5>
                      {(itinerary.itinerary?.packingChecklist || itinerary.packingChecklist || []).map((category, catIndex) => (
                        <div key={catIndex} className="packing-category">
                          <h6 className="packing-category-title">
                            {category.category}
                            {category.weatherBased && <span className="weather-badge">🌤️ Weather-based</span>}
                          </h6>
                          <ul className="packing-items">
                            {category.items && category.items.map((item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Fallback: Show message if no content rendered */}
                  {!((itinerary.itinerary?.days && itinerary.itinerary.days.length > 0) || 
                      (itinerary.days && itinerary.days.length > 0) ||
                      (itinerary.itinerary?.restaurants && itinerary.itinerary.restaurants.length > 0) ||
                      (itinerary.restaurants && itinerary.restaurants.length > 0) ||
                      (itinerary.itinerary?.packingChecklist && itinerary.itinerary.packingChecklist.length > 0) ||
                      (itinerary.packingChecklist && itinerary.packingChecklist.length > 0)) && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', background: '#f8f9fa', borderRadius: '8px' }}>
                      <p>✅ Itinerary generated successfully!</p>
                      <p style={{ fontSize: '14px', marginTop: '10px' }}>
                        However, the itinerary appears to be empty. Please check the debug section above to see the raw data structure.
                      </p>
                      <p style={{ fontSize: '12px', marginTop: '10px', color: '#999' }}>
                        If you see data in the debug section but nothing renders, there may be a data structure mismatch.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chat Interface */}
          <div className="trip-mate-chat-section">
            <div className="trip-mate-chat">
            <div className="trip-mate-chat-messages">
              {chatMessages.length === 0 && !itinerary && (
                <div className="trip-mate-welcome">
                  <p>👋 Hi! I'm TripMate, your AI travel assistant.</p>
                  
                  {isAuthenticated && user?.role === 'traveler' && !selectedBookingId && (
                    <p>Select a trip above to generate a personalized itinerary, or ask me general travel questions!</p>
                  )}
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`trip-mate-message ${msg.type}`}>
                  <div className="trip-mate-message-content">{msg.content}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="trip-mate-sources">
                      <strong>Sources:</strong>
                      <ul>
                        {msg.sources.map((source, srcIndex) => (
                          <li key={srcIndex}>
                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                              {source.title || source.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="trip-mate-message assistant">
                  <div className="trip-mate-message-content">
                    <span className="trip-mate-typing">TripMate is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="trip-mate-chat-input" onSubmit={handleSendMessage}>
              <input
                ref={chatInputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything about travel..."
                disabled={chatLoading}
              />
              <button type="submit" disabled={chatLoading || !message.trim()}>
                Send
              </button>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripMatePanel

