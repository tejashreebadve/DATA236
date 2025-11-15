import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPropertyById, updateProperty, fetchPropertiesByOwner } from '../../store/slices/propertiesSlice'
import { PROPERTY_TYPES } from '../../utils/constants'
import { getPropertyImageUrl } from '../../utils/imageUtils'
import './PropertyForm.css'

const EditProperty = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { selectedProperty } = useSelector((state) => state.properties)
  const { user } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    description: '',
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 1,
    pricing: { perNight: '' },
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
  const [existingPhotos, setExistingPhotos] = useState([])

  useEffect(() => {
    dispatch(fetchPropertyById(id))
  }, [dispatch, id])

  useEffect(() => {
    if (selectedProperty) {
      // Parse location - could be string or object
      let locationString = ''
      if (typeof selectedProperty.location === 'string') {
        locationString = selectedProperty.location
      } else if (selectedProperty.location && typeof selectedProperty.location === 'object') {
        // Build location string from object
        const parts = []
        if (selectedProperty.location.city) parts.push(selectedProperty.location.city)
        if (selectedProperty.location.state) parts.push(selectedProperty.location.state)
        if (selectedProperty.location.country) parts.push(selectedProperty.location.country)
        locationString = parts.length > 0 ? parts.join(', ') : (selectedProperty.location.address || '')
      }

      setFormData({
        name: selectedProperty.name || '',
        type: selectedProperty.type || '',
        location: locationString,
        description: selectedProperty.description || '',
        bedrooms: selectedProperty.bedrooms || 1,
        bathrooms: selectedProperty.bathrooms || 1,
        maxGuests: selectedProperty.maxGuests || 1,
        pricing: {
          perNight: selectedProperty.pricing?.basePrice || selectedProperty.pricing?.perNight || '',
        },
        amenities: selectedProperty.amenities || [],
        availability: selectedProperty.availability || {
          startDate: '',
          endDate: '',
        },
      })
      
      // Set existing photos
      setExistingPhotos(selectedProperty.photos || [])
    }
  }, [selectedProperty])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('pricing.')) {
      const field = name.split('.')[1]
      setFormData({
        ...formData,
        pricing: { ...formData.pricing, [field]: value === '' ? '' : (parseFloat(value) || 0) },
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

  const handleRemoveExistingPhoto = (index) => {
    setExistingPhotos(existingPhotos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const data = new FormData()
      
      // Add basic fields
      data.append('name', formData.name)
      data.append('type', formData.type)
      data.append('description', formData.description)
      data.append('bedrooms', formData.bedrooms.toString())
      data.append('bathrooms', formData.bathrooms.toString())
      data.append('maxGuests', formData.maxGuests.toString())
      
      // Add pricing using bracket notation (same as CreateProperty)
      const priceValue = formData.pricing.perNight === '' ? 0 : (parseFloat(formData.pricing.perNight) || 0)
      data.append('pricing[basePrice]', priceValue.toString())
      
      // Parse location string into object (same as CreateProperty)
      const locationParts = formData.location.split(',').map(s => s.trim())
      const city = locationParts[0] || formData.location
      const state = locationParts[1] || 'CA'
      const country = locationParts[2] || locationParts[1] || 'United States'
      const stateCode = state.length === 2 ? state.toUpperCase() : 'CA'
      
      data.append('location[address]', city)
      data.append('location[city]', city)
      data.append('location[state]', stateCode)
      data.append('location[country]', country)
      
      // Add amenities using bracket notation
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

      // Add existing photos (that weren't removed) as URLs
      existingPhotos.forEach(photo => {
        const photoUrl = typeof photo === 'string' ? photo : photo.url || photo
        data.append('photos[]', photoUrl)
      })

      // Add new file uploads
      if (files.length > 0) {
        files.forEach((file) => {
          data.append('photos', file)
        })
      }

      await dispatch(updateProperty({ id, data })).unwrap()
      
      // Refetch owner properties to ensure the list is up to date
      if (user?.id) {
        await dispatch(fetchPropertiesByOwner(user.id))
      }
      
      setSuccessMessage('Property updated successfully! Redirecting...')
      setTimeout(() => {
        navigate('/owner/properties')
      }, 1500)
    } catch (error) {
      // Extract error message
      let errorMsg = 'Failed to update property. Please check all required fields.'
      
      if (typeof error === 'string') {
        errorMsg = error
      } else if (error?.response?.data?.error) {
        const errorData = error.response.data.error
        if (errorData.details && Array.isArray(errorData.details)) {
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
        <button onClick={() => navigate('/owner/properties')} className="back-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to My Properties
        </button>
        <div className="header-content">
          <h1>Edit Property</h1>
        </div>

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
            <label>Location * (Format: City, State, Country)</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Mumbai, CA, India"
              required
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
            <div className="form-group">
              <label>Max Guests *</label>
              <input
                type="number"
                name="maxGuests"
                value={formData.maxGuests}
                onChange={handleChange}
                required
                min="1"
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
              />
            </div>
            <div className="form-group">
              <label>Available Until</label>
              <input
                type="date"
                name="availability.endDate"
                value={formData.availability.endDate}
                onChange={handleChange}
                min={formData.availability.startDate}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Existing Photos</label>
            {existingPhotos.length > 0 ? (
              <div className="existing-photos">
                {existingPhotos.map((photo, index) => (
                  <div key={index} className="existing-photo-item">
                    <img src={getPropertyImageUrl(photo)} alt={`Property ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(index)}
                      className="remove-photo-btn"
                    >
                      × Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-photos">No photos currently</p>
            )}
          </div>

          <div className="form-group">
            <label>Add More Photos</label>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} />
            {files.length > 0 && (
              <p className="file-count">{files.length} new file(s) selected</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Property'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditProperty

