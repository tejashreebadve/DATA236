import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProperties, updateSearchFilters } from '../store/slices/propertiesSlice'
import { addFavorite, removeFavorite, fetchFavorites } from '../store/slices/favoritesSlice'
import { getPropertyImageUrl } from '../utils/imageUtils'
import OwnerHome from './Home/OwnerHome'
import './Home.css'

const Home = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items: properties, loading } = useSelector((state) => state.properties)
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const { items: favorites } = useSelector((state) => state.favorites)

  // Show owner-specific homepage for owners
  if (isAuthenticated && user?.role === 'owner') {
    return <OwnerHome />
  }

  const [searchFilters, setSearchFilters] = useState({
    location: '',
    startDate: '',
    endDate: '',
    guests: 1,
  })
  const [searchExpanded, setSearchExpanded] = useState(false)

  useEffect(() => {
    // Fetch properties on mount
    dispatch(fetchProperties())
    if (isAuthenticated && user?.role === 'traveler') {
      dispatch(fetchFavorites())
    }
  }, [dispatch, isAuthenticated, user])

  const handleSearchChange = (e) => {
    const { name, value } = e.target
    setSearchFilters({ ...searchFilters, [name]: value })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(updateSearchFilters(searchFilters))
    navigate('/properties', { state: { filters: searchFilters } })
  }

  const handleFavorite = (e, propertyId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated || user?.role !== 'traveler') {
      navigate('/login')
      return
    }
    const isFavorite = favorites.some((fav) => fav._id === propertyId)
    if (isFavorite) {
      dispatch(removeFavorite(propertyId))
    } else {
      dispatch(addFavorite(propertyId))
    }
  }

  const isPropertyFavorite = (propertyId) => {
    return favorites.some((fav) => fav._id === propertyId)
  }

  return (
    <div className="home">
      {/* Search Bar Section - Airbnb Style */}
      <div className="search-section">
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-bar">
            <div className={`search-field ${searchExpanded ? 'expanded' : ''}`}>
              <label>Where</label>
              <input
                type="text"
                name="location"
                value={searchFilters.location}
                onChange={handleSearchChange}
                placeholder="Search destinations"
                onFocus={() => setSearchExpanded(true)}
              />
            </div>
            <div className={`search-field ${searchExpanded ? 'expanded' : ''}`}>
              <label>Check in</label>
              <input
                type="date"
                name="startDate"
                value={searchFilters.startDate}
                onChange={handleSearchChange}
                placeholder="Add dates"
                min={new Date().toISOString().split('T')[0]}
                onFocus={() => setSearchExpanded(true)}
              />
            </div>
            <div className={`search-field ${searchExpanded ? 'expanded' : ''}`}>
              <label>Check out</label>
              <input
                type="date"
                name="endDate"
                value={searchFilters.endDate}
                onChange={handleSearchChange}
                placeholder="Add dates"
                min={searchFilters.startDate || new Date().toISOString().split('T')[0]}
                onFocus={() => setSearchExpanded(true)}
              />
            </div>
            <div className={`search-field ${searchExpanded ? 'expanded' : ''}`}>
              <label>Who</label>
              <input
                type="number"
                name="guests"
                value={searchFilters.guests}
                onChange={handleSearchChange}
                placeholder="Add guests"
                min="1"
                onFocus={() => setSearchExpanded(true)}
              />
            </div>
            <button type="submit" className="search-button">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M13 23C18.5228 23 23 18.5228 23 13C23 7.47715 18.5228 3 13 3C7.47715 3 3 7.47715 3 13C3 18.5228 7.47715 23 13 23Z"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 21L29 29"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="properties-section">
        <div className="container">
          {loading ? (
            <div className="loading">Loading properties...</div>
          ) : properties.length > 0 ? (
            <div className="properties-grid">
              {properties.map((property) => (
                <Link
                  key={property._id}
                  to={`/properties/${property._id}`}
                  className="property-card"
                >
                  <div className="property-image-container">
                    {property.photos && property.photos.length > 0 ? (
                      <img
                        src={getPropertyImageUrl(property.photos[0])}
                        alt={property.name}
                        className="property-image"
                      />
                    ) : (
                      <div className="property-image-placeholder">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Heart Icon for Favorites */}
                    {isAuthenticated && user?.role === 'traveler' && (
                      <button
                        className={`favorite-heart ${isPropertyFavorite(property._id) ? 'favorited' : ''}`}
                        onClick={(e) => handleFavorite(e, property._id)}
                        aria-label="Add to favorites"
                      >
                        <svg
                          viewBox="0 0 32 32"
                          fill={isPropertyFavorite(property._id) ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M16 28c7-4.733 14-10 14-17a6.978 6.978 0 0 0-2-5A6.978 6.978 0 0 0 16 6a6.978 6.978 0 0 0-6-1A6.978 6.978 0 0 0 2 11c0 7 7 12.267 14 17z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="property-info">
                    <div className="property-header-info">
                      <h3 className="property-title">{property.location || property.name}</h3>
                      {property.type && (
                        <span className="property-type-badge">{property.type}</span>
                      )}
                    </div>
                    {property.name && property.name !== property.location && (
                      <p className="property-name">{property.name}</p>
                    )}
                    <div className="property-meta">
                      <span className="property-price">
                        ${property.pricing?.perNight || property.pricing?.basePrice || 0}
                        <span className="price-period"> night</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="no-properties">
              <p>No properties available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
