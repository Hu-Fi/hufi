# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && yarn workspaces focus --production

# Copy built application
COPY --from=builder /app/dist ./dist

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=12000

EXPOSE 12000

CMD ["node", "dist/src/main"]
