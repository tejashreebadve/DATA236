import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, updateProfile } from '../../store/slices/profileSlice'
import { COUNTRIES, US_STATES } from '../../utils/constants'
import './Profile.css'

const TravelerProfile = () => {
  const dispatch = useDispatch()
  const { traveler, loading } = useSelector((state) => state.profile)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    gender: '',
    languages: '',
    about: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    dispatch(fetchProfile('traveler'))
  }, [dispatch])

  useEffect(() => {
    if (traveler) {
      setFormData({
        name: traveler.name || '',
        email: traveler.email || '',
        phone: traveler.phone || '',
        country: traveler.country || '',
        state: traveler.state || '',
        city: traveler.city || '',
        gender: traveler.gender || '',
        languages: traveler.languages || '',
        about: traveler.about || '',
      })
    }
  }, [traveler])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await dispatch(updateProfile({ role: 'traveler', data: formData })).unwrap()
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      alert(`Update failed: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="loading">Loading profile...</div>

  return (
    <div className="profile-page">
      <div className="container">
        <h1>My Profile</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn btn-primary"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Country</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={!isEditing}
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
                disabled={!isEditing}
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
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={!isEditing}
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
              disabled={!isEditing}
              placeholder="e.g., English, Spanish, French"
            />
          </div>

          <div className="form-group">
            <label>About Me</label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleChange}
              disabled={!isEditing}
              rows="4"
            />
          </div>

          {isEditing && (
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default TravelerProfile

