# NextBase Task - Image/Video Upload with Thumbnail Generation

A full-stack application for handling file uploads with automatic thumbnail generation. Built with Next.js, Fastify, MongoDB, Redis, and BullMQ.

## Project Structure

```
.
├── backend/        # Fastify API server
├── frontend/       # Next.js web application
├── worker/         # Thumbnail generation service
├── infra/          # Docker and infrastructure configs
└── data/           # Shared data directory for uploads (local only)
```

## Recommended: Run Everything with Docker

### Prerequisites

- Docker and Docker Compose

### Quick Start

1. **Clone the repository:**

   ```bash
   git clone <https://github.com/harshilLakhani22/nextbase_task>
   cd nextbase_task
   ```

2. **Start all services using the Makefile:**

   ```bash
   cd infra
   make up
   ```

   - This will build and start MongoDB, Redis, backend, worker, and frontend.
   - The app will be available at: http://localhost:3000

3. **Stopping and rebuilding:**
   - To stop all services:
     ```bash
     make down
     ```
   - To rebuild images:
     ```bash
     make build
     ```

### Environment Variables

- All required environment variables are set in `infra/docker-compose.yml`.
- You do **not** need to manually copy or edit any `.env` files for Docker usage.

### Where are uploads and thumbnails stored?

- All uploaded files (originals and thumbnails) are stored in a Docker-managed volume (`uploads_data`).
- **Originals:** `/app/uploads/originals/<userId>/<filename>`
- **Thumbnails:** `/app/uploads/thumbnails/<userId>/<jobId>.webp`
- These are accessible via the backend at `/uploads/...` URLs (e.g., `http://localhost:4000/uploads/thumbnails/...`).
- The volume is shared between backend and worker containers for seamless processing.

---

## Manual Setup (Development, not recommended for production)

1. Start MongoDB and Redis (using Docker or local installation):

   ```bash
   cd infra
   docker compose up mongo redis -d
   ```

   Or, if you use Homebrew:

   - `brew services start mongodb-community`
   - `brew services start redis`

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

- Use absolute paths in UPLOAD_PATH for reliable file access (local dev only)
- The worker processes both images and videos differently
- Thumbnails are generated as 128x128 WebP format
- Frontend receives real-time updates via Socket.IO
- Files are served from a shared volume in Docker setup

## Docker Makefile Shortcuts

- `make up` — Build and start all services
- `make down` — Stop and remove all services
- `make build` — Build all images without starting

## License

MIT
