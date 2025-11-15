# RedNest Frontend

React frontend application for RedNest - An Airbnb-like platform.

## Tech Stack

- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Vite** - Build tool
- **date-fns** - Date utilities
- **React Hook Form** - Form handling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```env
VITE_API_BASE_URL=http://localhost:3001
```

3. Start development server:
```bash
npm run dev
```

The app will run on `http://localhost:3000`

## Project Structure

```
src/
├── components/       # Reusable components
│   └── Layout/      # Layout component with navigation
├── pages/           # Page components
│   ├── Auth/        # Login and Register pages
│   ├── Property/    # Property search, details, create, edit
│   ├── Profile/     # Traveler and Owner profile pages
│   ├── Booking/     # Booking management pages
│   ├── Favorites/   # Favorites page
│   └── Dashboard/   # Owner dashboard
├── store/           # Redux store
│   ├── slices/      # Redux slices (auth, properties, bookings, etc.)
│   └── store.js     # Store configuration
├── services/        # API service layer
│   └── api.js       # Axios configuration and API functions
└── utils/           # Utility functions and constants
    └── constants.js # Application constants
```

## Features

### Authentication
- Login/Register for Travelers and Owners
- JWT token management
- Protected routes

### Traveler Features
- Browse and search properties
- View property details
- Create booking requests
- Manage favorites
- View booking history
- Update profile

### Owner Features
- List properties
- Manage property listings
- View and respond to booking requests
- Dashboard with statistics
- Update profile

## State Management

Redux slices:
- `authSlice` - Authentication state
- `propertiesSlice` - Property data and search filters
- `bookingsSlice` - Booking data
- `favoritesSlice` - Favorite properties
- `profileSlice` - User profile data

## API Integration

All API calls are handled through:
- `services/api.js` - Centralized API configuration
- Axios interceptors for token management
- Error handling and token refresh

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

