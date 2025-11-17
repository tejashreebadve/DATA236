import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { fetchProperties, updateSearchFilters } from '../../store/slices/propertiesSlice'
import { getPropertyImageUrl } from '../../utils/imageUtils'
import './Property.css'

const PropertySearch = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const { items, loading, searchFilters: reduxFilters } = useSelector((state) => state.properties)
  
  // Get filters from navigation state, Redux state, or use defaults
  const getInitialFilters = () => {
    // Priority: location.state > Redux state > defaults
    if (location.state?.filters) {
      return location.state.filters
    }
    if (reduxFilters && (reduxFilters.location || reduxFilters.startDate || reduxFilters.endDate)) {
      return {
        location: reduxFilters.location || '',
        startDate: reduxFilters.startDate || '',
        endDate: reduxFilters.endDate || '',
        guests: reduxFilters.guests || 1,
      }
    }
    return {
      location: '',
      startDate: '',
      endDate: '',
      guests: 1,
    }
  }

  const [filters, setFilters] = useState(getInitialFilters())

  // Update filters when location state changes (e.g., navigating from Home)
  useEffect(() => {
    // Priority: location.state (from navigation) > Redux state > fetch all
    if (location.state?.filters) {
      // Filters passed from Home page navigation
      const newFilters = location.state.filters
      setFilters(newFilters)
      dispatch(updateSearchFilters(newFilters))
      dispatch(fetchProperties(newFilters))
    } else if (reduxFilters && (reduxFilters.location || reduxFilters.startDate || reduxFilters.endDate)) {
      // Use Redux filters if available (from previous search)
      const newFilters = {
        location: reduxFilters.location || '',
        startDate: reduxFilters.startDate || '',
        endDate: reduxFilters.endDate || '',
        guests: reduxFilters.guests || 1,
      }
      setFilters(newFilters)
      dispatch(fetchProperties(newFilters))
    } else {
      // Initial load - fetch all properties
      dispatch(fetchProperties())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Also listen for location.state changes (when navigating from Home)
  useEffect(() => {
    if (location.state?.filters) {
      const newFilters = location.state.filters
      setFilters(newFilters)
      dispatch(updateSearchFilters(newFilters))
      dispatch(fetchProperties(newFilters))
    }
  }, [location.state, dispatch])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    const updatedFilters = { ...filters, [name]: value }
    
    // If startDate changes and endDate is before new startDate, clear endDate
    if (name === 'startDate' && filters.endDate && value && filters.endDate < value) {
      updatedFilters.endDate = ''
    }
    
    setFilters(updatedFilters)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    dispatch(updateSearchFilters(filters))
    dispatch(fetchProperties(filters))
  }

  return (
    <div className="property-search">
      <div className="container">
        <h1>Search Properties</h1>

        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Where are you going?"
            />
          </div>

          <div className="form-group">
            <label>Check-in</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Check-out</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              min={filters.startDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Guests</label>
            <input
              type="number"
              name="guests"
              value={filters.guests}
              onChange={handleFilterChange}
              min="1"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {loading && <div className="loading">Loading properties...</div>}

        <div className="properties-grid">
          {items.map((property) => (
            <Link
              key={property._id}
              to={`/properties/${property._id}`}
              className="property-card"
            >
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
              <div className="property-info">
                <h3>{property.name}</h3>
                <p className="property-location">{property.location}</p>
                <p className="property-type">{property.type}</p>
                <p className="property-price">${property.pricing?.perNight || 0}/night</p>
              </div>
            </Link>
          ))}
        </div>

        {!loading && items.length === 0 && (
          <div className="no-results">No properties found. Try adjusting your search.</div>
        )}
      </div>
    </div>
  )
}

export default PropertySearch

