# ---- Base Node ----
FROM --platform=linux/amd64 node:lts-alpine3.20 AS base
WORKDIR /app

# Update and upgrade packages to ensure patching
RUN apk update && apk upgrade && \
    addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# Copy package files
COPY package*.json ./
RUN chown -R appuser:appgroup /app

# ---- Dependencies ----
FROM base AS dependencies
USER appuser

# Install dependencies with npm ci for faster, reliable, reproducible builds
RUN npm ci --only=production --frozen-lockfile

# ---- Build Dependencies ----
FROM base AS build-deps
USER appuser

# Install all dependencies including devDependencies for building
RUN npm ci --frozen-lockfile

# ---- Build ----
FROM build-deps AS build
COPY --chown=appuser:appgroup . .

# Build the application
RUN npm run build

# ---- Production ----
FROM --platform=linux/amd64 node:lts-alpine3.20 AS production

# Update and upgrade packages to ensure patching in the production stage
RUN apk update && apk upgrade && \
    addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy the standalone Next.js application
COPY --from=build --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=build --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=build --chown=appuser:appgroup /app/public ./public

# Use the non-root user
USER appuser

# Set NODE_ENV to production
ENV NODE_ENV=production

# Set production optimizations
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create a writable volume for temporary files
VOLUME /tmp

# Expose the port the app will run on
EXPOSE 3000

# Health check to ensure the application is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/auth/session || exit 1

# Start the application using the standalone server
CMD ["node", "server.js"]
    