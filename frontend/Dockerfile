# Build stage
FROM node:22-slim AS build

WORKDIR /app

# Install dependencies (use npm for broad compatibility)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:22-slim AS runtime

WORKDIR /app

# Copy built assets from build stage
COPY --from=build /app/.output ./.output

# TanStack Start / Nitro defaults to port 3000
EXPOSE 3000

# Start the production server
CMD ["node", ".output/server/index.mjs"]
