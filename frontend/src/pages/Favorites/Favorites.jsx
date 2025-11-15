import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchFavorites, removeFavorite } from '../../store/slices/favoritesSlice'
import './Favorites.css'

const Favorites = () => {
  const dispatch = useDispatch()
  const { items, loading } = useSelector((state) => state.favorites)

  useEffect(() => {
    dispatch(fetchFavorites())
  }, [dispatch])

  const handleRemoveFavorite = async (propertyId) => {
    if (window.confirm('Remove from favorites?')) {
      try {
        await dispatch(removeFavorite(propertyId)).unwrap()
      } catch (error) {
        alert(`Failed to remove favorite: ${error}`)
      }
    }
  }

  if (loading) return <div className="loading">Loading favorites...</div>

  return (
    <div className="favorites-page">
      <div className="container">
        <h1>My Favorites</h1>

        {items.length === 0 ? (
          <div className="no-favorites">
            <p>You haven't added any favorites yet.</p>
            <Link to="/properties" className="btn btn-primary">
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {items.map((property) => (
              <div key={property._id} className="favorite-card">
                {property.photos && property.photos.length > 0 && (
                  <img
                    src={property.photos[0]}
                    alt={property.name}
                    className="favorite-image"
                  />
                )}
                <div className="favorite-info">
                  <h3>
                    <Link to={`/properties/${property._id}`}>{property.name}</Link>
                  </h3>
                  <p className="favorite-location">{property.location}</p>
                  <p className="favorite-type">{property.type}</p>
                  <p className="favorite-price">${property.pricing?.perNight || 0}/night</p>
                  <button
                    onClick={() => handleRemoveFavorite(property._id)}
                    className="btn btn-outline remove-btn"
                  >
                    Remove from Favorites
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites

