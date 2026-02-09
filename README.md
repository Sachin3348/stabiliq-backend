# Stabiliq Backend – TypeScript/Express

Node.js/Express API for the Stabiliq Member Dashboard, written in TypeScript with a layered structure (routes → controllers → services → repository).

## Features

- **JWT Authentication** – Token-based auth with configurable expiration
- **MongoDB** – Mongoose ODM with typed repositories
- **REST API** – Same contract as the original Python/FastAPI backend
- **OTP Bypass** – Dev-friendly OTP flow for testing
- **File upload** – Resume upload (storage pluggable)
- **Financial assistance** – Unlocked 45 days after enrollment
- **Courses** – 6 predefined modules with lessons and PDFs

## Prerequisites

- **Node.js** v18+ (v20 recommended)
- **MongoDB** (local or Atlas)
- npm or yarn

## Setup and run

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and set:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=stabiliq
JWT_SECRET=your_secret_key_here
# or JWT_SECRET_KEY (both supported)
JWT_EXPIRE_DAYS=30
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
PORT=8000
NODE_ENV=development
```

### 3. Run the app

**Development** (watch mode with ts-node-dev):

```bash
npm run dev
```

**Production** (build then run):

```bash
npm run build
npm start
```

Server listens on `http://localhost:8000` (or your `PORT`).

## Scripts

| Script         | Description                    |
|----------------|--------------------------------|
| `npm run build`| Compile TypeScript to `dist/`  |
| `npm start`    | Run `node dist/server.js`      |
| `npm run dev`  | Run with ts-node-dev (reload)  |
| `npm run lint` | Run ESLint on `src/**/*.ts`    |
| `npm run lint:fix` | ESLint with auto-fix      |
| `npm run format`   | Prettier format            |
| `npm run format:check` | Prettier check only    |
| `npm test`     | Run Jest tests                |

## Project structure

```
src/
├── config/           # Typed env, database
├── commonservice/    # Logger (mailer, cache, etc. later)
├── controllers/     # HTTP layer: req/res, call services
├── middlewares/      # Auth, validation, error (AppError)
├── models/          # Mongoose schemas
├── repository/      # Data access (User, StatusCheck)
├── routes/          # Express route wiring
├── services/        # Business logic
├── types/           # DTOs, JwtPayload, express augment
├── utils/           # Pure helpers, response helpers
└── server.ts        # Entry: CORS, routes, error handler
```

## API endpoints

- **Base:** `GET /api/`, `GET|POST /api/status`
- **Auth:** `POST /api/auth/send-otp`, `verify-otp`, `login`, `GET /me`, `POST /logout`
- **Dashboard:** `GET /api/dashboard/stats`
- **Courses:** `GET /api/courses/modules`, `GET /api/courses/modules/:module_id`, `POST .../lessons/:lesson_id/complete`
- **Profile:** `POST /api/profile/upload-resume`, `POST /api/profile/analyze`
- **Financial assistance:** `GET /api/financial-assistance/status`, `POST /request`, `GET /documents-required`

Protected routes use header: `Authorization: Bearer <token>`.

## Environment variables

| Variable        | Description              | Default  |
|----------------|--------------------------|----------|
| `MONGO_URL`    | MongoDB connection string| required |
| `DB_NAME`      | Database name            | stabiliq |
| `JWT_SECRET`   | JWT signing secret        | (dev fallback) |
| `JWT_EXPIRE_DAYS` | Token expiry (days)   | 30       |
| `CORS_ORIGINS` | Allowed origins (comma)  | *        |
| `PORT`         | Server port               | 8000     |
| `NODE_ENV`     | development / production  | development |

## License

ISC
