# Stabiliq Backend - Node.js/Express

This is the Node.js/Express version of the Stabiliq Member Dashboard API, converted from the original Python/FastAPI backend.

## Features

- **JWT Authentication** - Token-based authentication with 30-day expiration
- **MongoDB Integration** - Async database operations using Mongoose
- **RESTful API** - Clean API structure matching the Python backend
- **OTP Bypass Mode** - Development mode for easy testing
- **File Upload Support** - Resume upload endpoint (ready for file storage implementation)
- **Financial Assistance** - Time-locked feature (45 days after enrollment)
- **Course Management** - 6 predefined course modules with lessons and PDFs

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Update the values:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=stabiliq
JWT_SECRET_KEY=your_secret_key_here
JWT_EXPIRE_DAYS=30
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
PORT=8000
NODE_ENV=development
```

3. **Start the server:**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:8000` (or the PORT specified in .env).

## API Endpoints

### Base URLs
- `GET /api/` - API root
- `GET /api/status` - Get status checks
- `POST /api/status` - Create status check

### Authentication (`/api/auth`)
- `POST /send-otp` - Send OTP (bypass mode)
- `POST /verify-otp` - Verify OTP and create/login user
- `POST /login` - Login (sends OTP)
- `GET /me` - Get current user (requires auth)
- `POST /logout` - Logout

### Dashboard (`/api/dashboard`)
- `GET /stats` - Get dashboard statistics (requires auth)

### Courses (`/api/courses`)
- `GET /modules` - Get all course modules (requires auth)
- `GET /modules/:module_id` - Get specific module (requires auth)
- `POST /modules/:module_id/lessons/:lesson_id/complete` - Mark lesson complete (requires auth)

### Profile Analysis (`/api/profile`)
- `POST /upload-resume` - Upload resume file (requires auth)
- `POST /analyze` - Analyze resume/LinkedIn profile (requires auth)

### Financial Assistance (`/api/financial-assistance`)
- `GET /status` - Get unlock status (requires auth)
- `POST /request` - Submit request (requires auth, 45-day lock)
- `GET /documents-required` - Get required documents list

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Project Structure

```
stabiliq-backend/
├── src/
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   └── logger.js        # Winston logger
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── errorHandler.js  # Error handling
│   ├── models/
│   │   ├── User.js          # User model
│   │   └── StatusCheck.js  # Status check model
│   ├── routes/
│   │   ├── index.js         # API root & status
│   │   ├── auth.js          # Authentication routes
│   │   ├── dashboard.js     # Dashboard routes
│   │   ├── courses.js       # Course routes
│   │   ├── profile.js       # Profile routes
│   │   └── financial_assistance.js  # Financial assistance routes
│   └── server.js            # Main server file
├── tests/                   # Test files
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Testing

Run tests with:
```bash
npm test
```

## Development

- Uses **Express.js** for the web framework
- Uses **Mongoose** for MongoDB ODM
- Uses **jsonwebtoken** for JWT handling
- Uses **express-validator** for request validation
- Uses **multer** for file uploads
- Uses **winston** for logging

## Differences from Python Backend

1. **Framework**: Express.js instead of FastAPI
2. **ORM**: Mongoose instead of Motor (async MongoDB driver)
3. **Validation**: express-validator instead of Pydantic
4. **File Upload**: multer instead of FastAPI's UploadFile
5. **Logging**: winston instead of Python's logging module

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | Required |
| `DB_NAME` | Database name | Required |
| `JWT_SECRET_KEY` | Secret for JWT signing | Required |
| `JWT_EXPIRE_DAYS` | Token expiration in days | 30 |
| `CORS_ORIGINS` | Comma-separated allowed origins | * |
| `PORT` | Server port | 8000 |
| `NODE_ENV` | Environment (development/production) | development |

## Notes

- OTP is currently in bypass mode (any OTP works)
- Resume upload returns mock URLs (file storage not implemented)
- Profile analysis returns mock data
- Course progress is not persisted to database yet
- Financial assistance requests are not stored in database yet

## License

ISC
