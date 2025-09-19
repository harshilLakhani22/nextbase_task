# backend/Dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps || yarn install --frozen-lockfile
COPY . .
RUN npm run build
EXPOSE 4000

# <<--- updated command to match your compiled output (dist/server.js) -->
CMD ["node", "dist/server.js"]