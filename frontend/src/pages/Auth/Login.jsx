import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, clearError } from '../../store/slices/authSlice'
import './Auth.css'

const Login = () => {
  const [role, setRole] = useState('traveler')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  )

  const from = location.state?.from?.pathname || `/${role}/dashboard`

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath =
        user.role === 'traveler' ? '/traveler/bookings' : '/owner/dashboard'
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(loginUser({ role, credentials: { email, password } }))
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to RedNest</h2>

        <div className="role-tabs">
          <button
            className={`tab ${role === 'traveler' ? 'active' : ''}`}
            onClick={() => setRole('traveler')}
          >
            Traveler
          </button>
          <button
            className={`tab ${role === 'owner' ? 'active' : ''}`}
            onClick={() => setRole('owner')}
          >
            Owner
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </p>
      </div>
    </div>
  )
}

export default Login

