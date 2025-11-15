import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, updateProfile } from '../../store/slices/profileSlice'
import { COUNTRIES, US_STATES } from '../../utils/constants'
import './Profile.css'

const OwnerProfile = () => {
  const dispatch = useDispatch()
  const { owner, loading } = useSelector((state) => state.profile)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    about: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    dispatch(fetchProfile('owner'))
  }, [dispatch])

  useEffect(() => {
    if (owner) {
      setFormData({
        name: owner.name || '',
        email: owner.email || '',
        phone: owner.phone || '',
        location: owner.location || '',
        about: owner.about || '',
      })
    }
  }, [owner])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await dispatch(updateProfile({ role: 'owner', data: formData })).unwrap()
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
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="City, State, Country"
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

export default OwnerProfile

