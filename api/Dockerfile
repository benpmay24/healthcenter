# API for Health Center — use Yarn to avoid npm "Exit handler never called" on Render
FROM node:20-alpine

# Build deps for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

# Use Yarn (via corepack) instead of npm
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

WORKDIR /app

# Install dependencies with Yarn
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

# Copy app
COPY . .

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server.js"]
