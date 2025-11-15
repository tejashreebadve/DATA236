import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import './Home.css'

const Home = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <h1>Welcome to RedNest</h1>
          <p className="hero-subtitle">Your Home Away From Home</p>
          <p className="hero-description">
            Discover unique places to stay and experiences around the world.
          </p>
          {!isAuthenticated && (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/properties" className="btn btn-outline">
                Browse Properties
              </Link>
            </div>
          )}
          {isAuthenticated && (
            <div className="hero-actions">
              <Link
                to={user?.role === 'traveler' ? '/traveler/bookings' : '/owner/dashboard'}
                className="btn btn-primary"
              >
                Go to Dashboard
              </Link>
              <Link to="/properties" className="btn btn-outline">
                Browse Properties
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Why Choose RedNest?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>For Travelers</h3>
              <ul>
                <li>Search properties by location, dates, and guests</li>
                <li>Save your favorite properties</li>
                <li>Manage your bookings and trips</li>
                <li>View booking history</li>
              </ul>
            </div>
            <div className="feature-card">
              <h3>For Owners</h3>
              <ul>
                <li>List your property easily</li>
                <li>Manage bookings and requests</li>
                <li>Track your revenue</li>
                <li>Update property details</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

