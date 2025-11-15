import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, updateProfile, uploadProfilePicture } from '../../store/slices/profileSlice'
import { COUNTRIES, US_STATES } from '../../utils/constants'
import { getProfilePictureUrl } from '../../utils/imageUtils'
import './Profile.css'

const TravelerProfile = () => {
  const dispatch = useDispatch()
  const { traveler, loading } = useSelector((state) => state.profile)
  const fileInputRef = useRef(null)
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
  const [selectedPictureFile, setSelectedPictureFile] = useState(null)
  const [picturePreview, setPicturePreview] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

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
      // Reset picture preview when profile loads
      setPicturePreview(null)
      setSelectedPictureFile(null)
    }
  }, [traveler])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePictureChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file')
        setTimeout(() => setErrorMessage(null), 3000)
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size should be less than 5MB')
        setTimeout(() => setErrorMessage(null), 3000)
        return
      }
      // Store the file for later upload
      setSelectedPictureFile(file)
      // Clear any previous errors
      setErrorMessage(null)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPicturePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setPicturePreview(null)
    setSelectedPictureFile(null)
    setSuccessMessage(null)
    setErrorMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Reset form data to original values
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)
    try {
      // First, upload picture if one was selected
      if (selectedPictureFile) {
        await dispatch(uploadProfilePicture({ role: 'traveler', file: selectedPictureFile })).unwrap()
      }
      // Then update profile data
      await dispatch(updateProfile({ role: 'traveler', data: formData })).unwrap()
      // Refetch profile to get updated data including picture
      await dispatch(fetchProfile('traveler'))
      setIsEditing(false)
      setPicturePreview(null)
      setSelectedPictureFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setSuccessMessage('Profile updated successfully!')
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      setErrorMessage(error || 'Failed to update profile. Please try again.')
      setTimeout(() => setErrorMessage(null), 5000)
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
          onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
          className="btn btn-primary"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>

        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-error">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <label>Profile Picture</label>
            <div className="profile-picture-container">
              <div className="profile-picture-preview">
                <img
                  src={
                    picturePreview ||
                    (traveler?.profilePicture ? `${getProfilePictureUrl(traveler.profilePicture, 'traveler')}?t=${Date.now()}` : 'https://via.placeholder.com/150?text=No+Photo')
                  }
                  alt="Profile"
                  className="profile-picture-img"
                  onError={(e) => {
                    // Fallback if image fails to load
                    if (e.target.src !== 'https://via.placeholder.com/150?text=No+Photo') {
                      e.target.src = 'https://via.placeholder.com/150?text=No+Photo'
                    }
                  }}
                  key={traveler?.profilePicture ? `${traveler.profilePicture}-${Date.now()}` : picturePreview}
                />
                {isEditing && (
                  <div className="profile-picture-overlay">
                    <span className="overlay-text">Change Photo</span>
                  </div>
                )}
              </div>
              <div className="profile-picture-controls">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  className="file-input"
                  id="profile-picture-input"
                  disabled={!isEditing}
                />
                <label
                  htmlFor="profile-picture-input"
                  className={`upload-photo-btn ${!isEditing ? 'disabled' : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {picturePreview ? 'Change Photo' : 'Upload Photo'}
                </label>
                {picturePreview && isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setPicturePreview(null)
                      setSelectedPictureFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="btn btn-outline remove-preview-btn"
                  >
                    Remove
                  </button>
                )}
                <p className="upload-hint">JPG, PNG or GIF. Max size 5MB</p>
              </div>
            </div>
          </div>
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

