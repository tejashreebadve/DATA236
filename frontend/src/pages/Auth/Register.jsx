import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { registerUser, clearError } from '../../store/slices/authSlice'
import { COUNTRIES, US_STATES } from '../../utils/constants'
import './Auth.css'

const Register = () => {
  const [role, setRole] = useState('traveler')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    gender: '',
    languages: '',
  })
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  )

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath =
        user.role === 'traveler' ? '/traveler/profile' : '/owner/profile'
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Filter out empty strings and undefined values
    const cleanData = Object.entries(formData).reduce((acc, [key, value]) => {
      // Only include non-empty values for registration
      // Backend only accepts: name, email, password, phone (optional)
      if (value && value.trim() !== '') {
        // For registration, only send: name, email, password, phone
        if (['name', 'email', 'password', 'phone'].includes(key)) {
          acc[key] = value.trim()
        }
      }
      return acc
    }, {})
    
    dispatch(registerUser({ role, data: cleanData }))
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Join RedNest</h2>

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
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a password"
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label>Country</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
            >
              <option value="">Select Country</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {formData.country === 'US' && (
            <div className="form-group">
              <label>State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
              >
                <option value="">Select State</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter your city"
            />
          </div>

          {role === 'traveler' && (
            <>
              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label>Languages</label>
                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="e.g., English, Spanish, French"
                />
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  )
}

export default Register

