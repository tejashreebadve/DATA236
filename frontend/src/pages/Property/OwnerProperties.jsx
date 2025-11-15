import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPropertiesByOwner } from '../../store/slices/propertiesSlice'
import { getPropertyImageUrl } from '../../utils/imageUtils'
import './PropertyForm.css'

const OwnerProperties = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items: properties, loading } = useSelector((state) => state.properties)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchPropertiesByOwner(user.id))
    }
  }, [dispatch, user?.id])

  if (loading) {
    return (
      <div className="property-form-page">
        <div className="container">
          <div className="loading">Loading properties...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="property-form-page">
      <div className="container">
        <div className="page-header">
          <button onClick={() => navigate('/owner/dashboard')} className="back-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="header-content">
            <h1>My Properties</h1>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="no-properties">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <h2>No properties yet</h2>
            <p>Start listing your properties to begin earning!</p>
            <Link to="/owner/properties/create" className="btn btn-primary">
              List Your First Property
            </Link>
          </div>
        ) : (
          <div className="properties-grid-list">
            {properties.map((property) => (
              <Link
                key={property._id}
                to={`/properties/${property._id}`}
                className="property-card-list"
              >
                <div className="property-image-wrapper">
                  {property.photos && property.photos.length > 0 ? (
                    <img
                      src={getPropertyImageUrl(property.photos[0])}
                      alt={property.name}
                      className="property-image-list"
                    />
                  ) : (
                    <div className="property-image-placeholder-list">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="property-info-list">
                  <div className="property-header-list">
                    <h3>{property.name}</h3>
                    <span className="property-type-badge-list">{property.type}</span>
                  </div>
                  <p className="property-location-list">{property.location}</p>
                  <div className="property-meta-list">
                    <span>{property.bedrooms} bed</span>
                    <span>•</span>
                    <span>{property.bathrooms} bath</span>
                    <span>•</span>
                    <span>{property.maxGuests || property.bedrooms * 2} guests</span>
                  </div>
                  <div className="property-footer-list">
                    <span className="property-price-list">
                      ${property.pricing?.perNight || property.pricing?.basePrice || 0}
                      <span className="price-period-list">/night</span>
                    </span>
                    <Link
                      to={`/owner/properties/${property._id}/edit`}
                      className="btn btn-outline btn-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerProperties

