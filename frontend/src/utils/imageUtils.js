/**
 * Get the full URL for an uploaded image
 * In development, uses relative paths that go through Vite proxy
 * @param {string} imagePath - The image path from the database (e.g., "uploads/profile-123.jpg")
 * @param {string} role - The role (traveler or owner) to determine which service to use
 * @returns {string} - The full URL to the image
 */
export const getProfilePictureUrl = (imagePath, role = 'traveler') => {
  if (!imagePath) return null
  
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // Normalize the path to start with /uploads
  // Backend stores as "uploads/profile-123.jpg" (no leading slash)
  let normalizedPath = imagePath
  
  // If it doesn't start with /, add it
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`
  }
  
  // Ensure it starts with /uploads (in case path is just "profile-123.jpg")
  if (!normalizedPath.startsWith('/uploads')) {
    normalizedPath = `/uploads${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`
  }
  
  // Use relative paths that go through nginx proxy (works in both dev and production)
  // For owner service, use owner-uploads proxy
  if (role === 'owner') {
    return normalizedPath.replace(/^\/uploads/, '/owner-uploads')
  }
  // For traveler service, use relative path (nginx will proxy)
  return normalizedPath
}

/**
 * Get the full URL for a property image
 * Property images are served by the property service (port 3004)
 * @param {string} imagePath - The image path from the database (e.g., "uploads/property-123.jpg")
 * @returns {string} - The full URL to the image
 */
export const getPropertyImageUrl = (imagePath) => {
  if (!imagePath) return null
  
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // Normalize the path to start with /uploads
  let normalizedPath = imagePath
  
  // If it doesn't start with /, add it
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`
  }
  
  // Ensure it starts with /uploads
  if (!normalizedPath.startsWith('/uploads')) {
    normalizedPath = `/uploads${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`
  }
  
  // Use relative path that goes through nginx proxy (works in both dev and production)
  // Use property-uploads proxy which routes to property service
  return normalizedPath.replace(/^\/uploads/, '/property-uploads')
}

