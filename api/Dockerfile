# API for Health Center — Docker build avoids npm "Exit handler never called" on Render
FROM node:20-alpine

# Build deps for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies first (better layer cache)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy app
COPY . .

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server.js"]
