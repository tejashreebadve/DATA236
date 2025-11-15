import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { createProperty } from '../../store/slices/propertiesSlice'
import { PROPERTY_TYPES } from '../../utils/constants'
import './PropertyForm.css'

const CreateProperty = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    description: '',
    bedrooms: 1,
    bathrooms: 1,
    pricing: { perNight: '' }, // Start as empty string for better UX
    amenities: [],
    availability: {
      startDate: '',
      endDate: '',
    },
  })
  const [amenityInput, setAmenityInput] = useState('')
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('pricing.')) {
      const field = name.split('.')[1]
      // For price, allow empty string or parse as number
      // If empty, store as empty string; otherwise parse as float
      const numValue = value === '' ? '' : parseFloat(value)
      // Only update if it's a valid number or empty string
      if (numValue !== '' && isNaN(numValue)) {
        return // Don't update if invalid
      }
      setFormData({
        ...formData,
        pricing: { ...formData.pricing, [field]: numValue },
      })
    } else if (name.startsWith('availability.')) {
      const field = name.split('.')[1]
      setFormData({
        ...formData,
        availability: { ...formData.availability, [field]: value },
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleAddAmenity = () => {
    if (amenityInput.trim()) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput.trim()],
      })
      setAmenityInput('')
    }
  }

  const handleRemoveAmenity = (index) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index),
    })
  }

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      // Build FormData with proper structure for backend
      const data = new FormData()
      
      // Add basic fields
      data.append('name', formData.name)
      data.append('type', formData.type)
      data.append('description', formData.description)
      data.append('bedrooms', formData.bedrooms.toString())
      data.append('bathrooms', formData.bathrooms.toString())
      data.append('maxGuests', formData.bedrooms * 2) // Default max guests
      
      // Add pricing using bracket notation (express.urlencoded will parse nested objects)
      const priceValue = formData.pricing.perNight === '' ? 0 : (parseFloat(formData.pricing.perNight) || 0)
      data.append('pricing[basePrice]', priceValue.toString())
      
      // Add location - backend expects location.address, location.city, location.state (2 chars), location.country
      const locationParts = formData.location.split(',').map(s => s.trim())
      const city = locationParts[0] || formData.location
      const state = locationParts[1] || 'CA' // Default to CA if not provided
      const country = locationParts[2] || locationParts[1] || 'United States'
      
      // Ensure state is exactly 2 characters (backend requirement)
      const stateCode = state.length === 2 ? state.toUpperCase() : 'CA'
      
      data.append('location[address]', city)
      data.append('location[city]', city)
      data.append('location[state]', stateCode)
      data.append('location[country]', country)
      
      // Add amenities - send as repeated fields (express.urlencoded will parse as array)
      formData.amenities.forEach((amenity) => {
        data.append('amenities[]', amenity)
      })
      
      // Add availability dates if provided (using bracket notation)
      if (formData.availability.startDate) {
        data.append('availability[startDate]', formData.availability.startDate)
      }
      if (formData.availability.endDate) {
        data.append('availability[endDate]', formData.availability.endDate)
      }

      // Add photos
      files.forEach((file) => {
        data.append('photos', file)
      })

      await dispatch(createProperty(data)).unwrap()
      setSuccessMessage('Property created successfully! Redirecting...')
      setTimeout(() => {
        navigate('/owner/dashboard')
      }, 2000)
    } catch (error) {
      // Extract error message from validation errors
      let errorMsg = 'Failed to create property. Please check all required fields.'
      
      if (typeof error === 'string') {
        errorMsg = error
      } else if (error?.response?.data?.error) {
        // Backend validation error format
        const errorData = error.response.data.error
        if (errorData.details && Array.isArray(errorData.details)) {
          // Extract validation error messages
          const validationErrors = errorData.details.map(d => d.msg || d.message || `${d.param}: ${d.msg}`).join(', ')
          errorMsg = `Validation failed: ${validationErrors}`
        } else if (errorData.message) {
          errorMsg = errorData.message
        }
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message
      } else if (error?.message) {
        errorMsg = error.message
      }
      
      setErrorMessage(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="property-form-page">
      <div className="container">
        <h1>List Your Property</h1>
        
        {errorMessage && (
          <div className="alert alert-error">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="property-form">
          <div className="form-group">
            <label>Property Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter property name"
            />
          </div>

          <div className="form-group">
            <label>Property Type *</label>
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option value="">Select Type</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="City, State, Country"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Describe your property"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Bedrooms *</label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                required
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Bathrooms *</label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                required
                min="1"
                step="0.5"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Price per Night ($) *</label>
            <input
              type="number"
              name="pricing.perNight"
              value={formData.pricing.perNight}
              onChange={handleChange}
              required
              min="0"
              step="1"
              placeholder="Enter price per night"
            />
          </div>

          <div className="form-group">
            <label>Amenities</label>
            <div className="amenity-input">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                placeholder="Add amenity and press Enter"
              />
              <button type="button" onClick={handleAddAmenity} className="btn btn-outline">
                Add
              </button>
            </div>
            <div className="amenities-list">
              {formData.amenities.map((amenity, index) => (
                <span key={index} className="amenity-tag">
                  {amenity}
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(index)}
                    className="remove-amenity"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Available From</label>
              <input
                type="date"
                name="availability.startDate"
                value={formData.availability.startDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label>Available Until</label>
              <input
                type="date"
                name="availability.endDate"
                value={formData.availability.endDate}
                onChange={handleChange}
                min={formData.availability.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Photos</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
            {files.length > 0 && (
              <p className="file-count">{files.length} file(s) selected</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Property'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateProperty

