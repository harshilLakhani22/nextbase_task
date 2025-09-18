# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps || yarn install --frozen-lockfile
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/src/server.js"]
