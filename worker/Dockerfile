# worker/Dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app

# system deps needed for ffmpeg, png handling, etc.
RUN apk add --no-cache \
    ffmpeg \
    libc6-compat \
    tzdata

# Install node deps
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps || yarn install --frozen-lockfile

# Copy source & build
COPY . .
RUN npm run build

# updated to match your compiled output:
CMD ["node", "dist/worker.js"]