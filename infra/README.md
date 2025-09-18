# Infra Setup

## Run Full Stack with Docker Compose

```sh
make up
```

- This will build and start MongoDB, Redis, backend, worker, and frontend.
- Uploads are persisted in `./data/uploads` (host) and mounted to `/app/uploads` in backend/worker.

## Stop All Services

```sh
make down
```

## Build Images Only

```sh
make build
```

## Run Services Individually (Dev Mode)

- Backend:
  ```sh
  cd backend
  npm install
  npm run dev
  ```
- Worker:
  ```sh
  cd worker
  npm install
  npm run start:worker
  ```
- Frontend:

  ```sh
  cd frontend
  npm install
  npm run dev
  ```

- Make sure MongoDB and Redis are running (can use Docker Compose for just those):
  ```sh
  docker compose -f infra/docker-compose.yml up mongo redis
  ```
