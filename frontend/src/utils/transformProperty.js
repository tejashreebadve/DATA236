/**
 * Transform backend property format to frontend format
 * Maps backend field names to frontend expected format
 */

export const transformProperty = (property) => {
  if (!property) return null

  // Transform location object to string format for display
  let locationString = ''
  if (typeof property.location === 'string') {
    // If location is already a string, use it
    locationString = property.location
  } else if (property.location && typeof property.location === 'object') {
    // Build location string from object
    const parts = []
    if (property.location.city) parts.push(property.location.city)
    if (property.location.state) parts.push(property.location.state)
    if (property.location.country) parts.push(property.location.country)
    locationString = parts.length > 0 ? parts.join(', ') : (property.location.address || '')
  }

  // Transform pricing.basePrice to pricing.perNight for frontend
  const transformedProperty = {
    ...property,
    location: locationString || property.location?.address || property.location || '',
    pricing: {
      ...property.pricing,
      perNight: property.pricing?.basePrice || property.pricing?.perNight || 0,
      basePrice: property.pricing?.basePrice || property.pricing?.perNight || 0,
    },
    // Ensure maxGuests exists (frontend uses 'guests' in filters)
    maxGuests: property.maxGuests || property.guests || 1,
    // Keep original location object for editing if it exists
    locationDetails: typeof property.location === 'object' ? property.location : (property.locationDetails || {}),
  }

  return transformedProperty
}

export const transformProperties = (properties) => {
  if (!Array.isArray(properties)) {
    return properties ? [transformProperty(properties)] : []
  }
  return properties.map(transformProperty)
}

