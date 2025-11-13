# Authentication Service

Handles user registration, login, and JWT token management for RedNest platform.

## Features

- Traveler registration and login
- Owner registration and login
- JWT access token generation and verification
- JWT refresh token support
- Password hashing with bcrypt
- Request validation with express-validator
- Error handling middleware

## Environment Variables

Create a `.env` file in the service root directory:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rednest_auth?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

## Installation

```bash
npm install
```

## Running Locally

```bash
npm run dev
```

The service will run on `http://localhost:3001`

## Running with Docker

```bash
docker build -t auth-service .
docker run -p 3001:3001 --env-file .env auth-service
```

Or use docker-compose from the root directory:

```bash
docker-compose up auth-service
```

## API Endpoints

- `POST /api/auth/register/traveler` - Register new traveler
- `POST /api/auth/register/owner` - Register new owner
- `POST /api/auth/login/traveler` - Login as traveler
- `POST /api/auth/login/owner` - Login as owner
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify` - Verify JWT token
- `GET /health` - Health check

See [API_REFERENCE.md](../../API_REFERENCE.md) for detailed request/response formats.

## Testing

```bash
npm test
```

## Health Check

```bash
curl http://localhost:3001/health
```

