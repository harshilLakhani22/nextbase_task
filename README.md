# NextBase Task - Image/Video Upload with Thumbnail Generation

A full-stack application for handling file uploads with automatic thumbnail generation. Built with Next.js, Fastify, MongoDB, Redis, and BullMQ.

## Project Structure

```
.
├── backend/        # Fastify API server
├── frontend/       # Next.js web application
├── worker/         # Thumbnail generation service
├── infra/         # Docker and infrastructure configs
└── data/          # Shared data directory for uploads
```

## Prerequisites

- Node.js v20+
- MongoDB v7+
- Redis v7+
- Docker and Docker Compose (optional)

## Quick Start with Docker

1. Clone the repository:

```bash
git clone <repository-url>
cd nextbase_task
```

2. Copy sample .env files:

```bash
cp backend/.env.example backend/.env
cp worker/.env.example worker/.env
cp frontend/.env.example frontend/.env
cp infra/.env.example infra/.env
```

3. Start all services with Docker Compose:

```bash
cd infra
make up
```

Visit http://localhost:3000 to access the application.

## Manual Setup (Development)

1. Start MongoDB and Redis (using Docker or local installation):

```bash
cd infra
docker compose up mongo redis -d
```

- local command for mongodb :- brew services start mongodb-community
- local command for redis :- brew services start redis

2. Setup and start the backend:

```bash
cd backend
npm install
npm run dev
```

3. Setup and start the worker:

```bash
cd worker
npm install
npm run dev
```

4. Setup and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/nextbase ##(nextbase is db name)
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecretkey
UPLOAD_PATH=/absolute/path/to/nextbase_task/data/uploads
```

### Worker (.env)

```env
MONGO_URI=mongodb://localhost:27017/nextbase ##(nextbase is db name)
REDIS_URL=redis://localhost:6379
UPLOAD_PATH=/absolute/path/to/nextbase_task/data/uploads
```

### Frontend (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Features

- User authentication (signup/login)
- Image and video upload
- Automatic thumbnail generation
- Real-time upload status updates
- Scalable worker architecture
- Shared upload storage

## API Endpoints

### Authentication

- POST `/api/auth/signup` - Create new user account
- POST `/api/auth/login` - Login existing user

### File Upload

- POST `/api/upload` - Upload files (authenticated)
- GET `/uploads/*` - Access uploaded files and thumbnails

## Architecture

- **Frontend**: Next.js application handling UI and user interactions
- **Backend**: Fastify server managing authentication and file uploads
- **Worker**: Processes thumbnail generation jobs using BullMQ
- **MongoDB**: Stores user accounts and job metadata
- **Redis**: Powers job queue and real-time updates
- **Socket.IO**: Enables real-time status updates

## Development Notes

- Use absolute paths in UPLOAD_PATH for reliable file access
- The worker processes both images and videos differently
- Thumbnails are generated as 128x128 WebP format
- Frontend receives real-time updates via Socket.IO
- Files are served from a shared volume in Docker setup

## License

MIT
