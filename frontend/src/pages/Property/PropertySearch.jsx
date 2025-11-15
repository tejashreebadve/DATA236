import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchProperties, updateSearchFilters } from '../../store/slices/propertiesSlice'
import './Property.css'

const PropertySearch = () => {
  const dispatch = useDispatch()
  const { items, loading, searchFilters } = useSelector((state) => state.properties)
  const [filters, setFilters] = useState({
    location: '',
    startDate: '',
    endDate: '',
    guests: 1,
  })

  useEffect(() => {
    dispatch(fetchProperties())
  }, [dispatch])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({ ...filters, [name]: value })
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
            />
          </div>

          <div className="form-group">
            <label>Check-out</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
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
              {property.photos && property.photos.length > 0 && (
                <img
                  src={property.photos[0]}
                  alt={property.name}
                  className="property-image"
                />
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

