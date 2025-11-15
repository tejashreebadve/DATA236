import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchFavorites, removeFavorite } from '../../store/slices/favoritesSlice'
import { getPropertyImageUrl } from '../../utils/imageUtils'
import './Favorites.css'

const Favorites = () => {
  const dispatch = useDispatch()
  const { items, loading } = useSelector((state) => state.favorites)

  useEffect(() => {
    dispatch(fetchFavorites())
  }, [dispatch])

  const handleRemoveFavorite = (e, propertyId) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(removeFavorite(propertyId))
  }

  if (loading) return <div className="loading">Loading favorites...</div>

  return (
    <div className="favorites-page">
      <div className="container">
        <h1>My Favorites</h1>

        {items.length === 0 ? (
          <div className="no-favorites">
            <p>You haven't added any favorites yet.</p>
            <Link to="/" className="btn btn-primary">
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {items.map((property) => (
              <Link
                key={property._id}
                to={`/properties/${property._id}`}
                className="favorite-card"
              >
                <div className="favorite-image-container">
                  {property.photos && property.photos.length > 0 ? (
                    <img
                      src={getPropertyImageUrl(property.photos[0])}
                      alt={property.name}
                      className="favorite-image"
                    />
                  ) : (
                    <div className="favorite-image-placeholder">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  )}
                  {/* Heart Icon - Always favorited on this page */}
                  <button
                    className="favorite-heart favorited"
                    onClick={(e) => handleRemoveFavorite(e, property._id)}
                    aria-label="Remove from favorites"
                  >
                    <svg
                      viewBox="0 0 32 32"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M16 28c7-4.733 14-10 14-17a6.978 6.978 0 0 0-2-5A6.978 6.978 0 0 0 16 6a6.978 6.978 0 0 0-6-1A6.978 6.978 0 0 0 2 11c0 7 7 12.267 14 17z" />
                    </svg>
                  </button>
                </div>
                <div className="favorite-info">
                  <h3>{property.name}</h3>
                  <p className="favorite-location">{property.location}</p>
                  <p className="favorite-type">{property.type}</p>
                  <p className="favorite-price">${property.pricing?.perNight || 0}/night</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites