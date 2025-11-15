import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout, verifyToken } from '../../store/slices/authSlice'
import './Layout.css'

const Layout = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // Verify token on mount if user is authenticated
    if (isAuthenticated && localStorage.getItem('token')) {
      dispatch(verifyToken())
    }
  }, [dispatch, isAuthenticated])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <span className="logo-text">RedNest</span>
            </Link>

            <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
              <Link to="/" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <Link to="/properties" onClick={() => setMenuOpen(false)}>
                Browse Properties
              </Link>

              {isAuthenticated ? (
                <>
                  {user?.role === 'traveler' && (
                    <>
                      <Link to="/traveler/bookings" onClick={() => setMenuOpen(false)}>
                        My Trips
                      </Link>
                      <Link to="/traveler/favorites" onClick={() => setMenuOpen(false)}>
                        Favorites
                      </Link>
                    </>
                  )}
                  {user?.role === 'owner' && (
                    <>
                      <Link to="/owner/dashboard" onClick={() => setMenuOpen(false)}>
                        Dashboard
                      </Link>
                      <Link to="/owner/bookings" onClick={() => setMenuOpen(false)}>
                        Bookings
                      </Link>
                      <Link
                        to="/owner/properties/create"
                        onClick={() => setMenuOpen(false)}
                      >
                        List Property
                      </Link>
                    </>
                  )}
                  <Link to={`/${user?.role}/profile`} onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="btn-logout">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </nav>

            <button
              className="menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 RedNest. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout

