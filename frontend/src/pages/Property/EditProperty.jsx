import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPropertyById, updateProperty } from '../../store/slices/propertiesSlice'
import { PROPERTY_TYPES } from '../../utils/constants'
import './PropertyForm.css'

const EditProperty = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { selectedProperty } = useSelector((state) => state.properties)

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    description: '',
    bedrooms: 1,
    bathrooms: 1,
    pricing: { perNight: 0 },
    amenities: [],
    availability: {
      startDate: '',
      endDate: '',
    },
  })
  const [amenityInput, setAmenityInput] = useState('')
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    dispatch(fetchPropertyById(id))
  }, [dispatch, id])

  useEffect(() => {
    if (selectedProperty) {
      setFormData({
        name: selectedProperty.name || '',
        type: selectedProperty.type || '',
        location: selectedProperty.location || '',
        description: selectedProperty.description || '',
        bedrooms: selectedProperty.bedrooms || 1,
        bathrooms: selectedProperty.bathrooms || 1,
        pricing: selectedProperty.pricing || { perNight: 0 },
        amenities: selectedProperty.amenities || [],
        availability: selectedProperty.availability || {
          startDate: '',
          endDate: '',
        },
      })
    }
  }, [selectedProperty])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('pricing.')) {
      const field = name.split('.')[1]
      setFormData({
        ...formData,
        pricing: { ...formData.pricing, [field]: parseFloat(value) || 0 },
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

    try {
      const data = new FormData()
      Object.keys(formData).forEach((key) => {
        if (key === 'pricing' || key === 'availability') {
          data.append(key, JSON.stringify(formData[key]))
        } else if (key === 'amenities') {
          data.append('amenities', JSON.stringify(formData[key]))
        } else {
          data.append(key, formData[key])
        }
      })

      if (files.length > 0) {
        files.forEach((file) => {
          data.append('photos', file)
        })
      }

      await dispatch(updateProperty({ id, data })).unwrap()
      alert('Property updated successfully!')
      navigate('/owner/dashboard')
    } catch (error) {
      alert(`Failed to update property: ${error}`)
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
            <label>Location *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
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
              step="0.01"
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

