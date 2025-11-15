import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout, verifyToken } from '../../store/slices/authSlice'
import './Layout.css'

const Layout = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    // Verify token on mount if user is authenticated
    if (isAuthenticated && localStorage.getItem('token')) {
      dispatch(verifyToken())
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
    setMenuOpen(false)
    setUserMenuOpen(false)
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <span className="logo-icon">🏠</span>
              <span className="logo-text">RedNest</span>
            </Link>

  {/* Desktop Navigation - Removed owner menu items */}
  <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
    {/* Owner menu items removed - they're in the homepage CTA buttons */}
  </nav>

            {/* User Menu Button - Airbnb Style */}
            <div className="user-menu-wrapper" ref={userMenuRef}>
              {isAuthenticated ? (
                <button
                  className="user-menu-button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="User menu"
                >
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="16" fill="currentColor" />
                    <path
                      d="M16 16C18.2091 16 20 14.2091 20 12C20 9.79086 18.2091 8 16 8C13.7909 8 12 9.79086 12 12C12 14.2091 13.7909 16 16 16Z"
                      fill="white"
                    />
                    <path
                      d="M16 18C11.5817 18 8 19.7909 8 22V24H24V22C24 19.7909 20.4183 18 16 18Z"
                      fill="white"
                    />
                  </svg>
                  <svg
                    className={`menu-arrow ${userMenuOpen ? 'open' : ''}`}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  className="user-menu-button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="User menu"
                >
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="16" fill="currentColor" />
                    <line
                      x1="10"
                      y1="16"
                      x2="22"
                      y2="16"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="10"
                      y1="11"
                      x2="22"
                      y2="11"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="10"
                      y1="21"
                      x2="22"
                      y2="21"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <svg
                    className={`menu-arrow ${userMenuOpen ? 'open' : ''}`}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="user-menu-dropdown">
                  {isAuthenticated ? (
                    <>
                      <div className="user-menu-header">
                        <div className="user-info">
                          <p className="user-name">{user?.name || 'User'}</p>
                          <p className="user-email">{user?.email}</p>
                          <p className="user-role">{user?.role === 'traveler' ? 'Traveler' : 'Owner'}</p>
                        </div>
                      </div>
                      <div className="menu-divider"></div>
                      {user?.role === 'traveler' && (
                        <>
                          <Link
                            to="/traveler/bookings"
                            className="menu-item"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            My Trips
                          </Link>
                          <Link
                            to="/traveler/favorites"
                            className="menu-item"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Favorites
                          </Link>
                        </>
                      )}
                      {user?.role === 'owner' && (
                        <>
                          <Link
                            to="/owner/dashboard"
                            className="menu-item"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <Link
                            to="/owner/bookings"
                            className="menu-item"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            My Bookings
                          </Link>
                          <Link
                            to="/owner/properties/create"
                            className="menu-item"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            List Property
                          </Link>
                        </>
                      )}
                      <Link
                        to={`/${user?.role}/profile`}
                        className="menu-item"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <div className="menu-divider"></div>
                      <button onClick={handleLogout} className="menu-item logout">
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="menu-item"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        to="/register"
                        className="menu-item"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
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
