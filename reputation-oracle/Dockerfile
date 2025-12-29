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

# Build args for TDX measurements (baked at build time)
ARG TDX_EXPECTED_MRTD=""
ARG TDX_EXPECTED_RTMR0=""
ARG TDX_EXPECTED_RTMR1=""
ARG TDX_EXPECTED_RTMR2=""
ARG TDX_EXPECTED_RTMR3=""
ARG TDX_BUILD_GIT_SHA=""
ARG TDX_BUILD_IMAGE_DIGEST=""
ARG TDX_BUILD_TIMESTAMP=""

# Set as env vars so they're available at runtime
ENV TDX_EXPECTED_MRTD=$TDX_EXPECTED_MRTD
ENV TDX_EXPECTED_RTMR0=$TDX_EXPECTED_RTMR0
ENV TDX_EXPECTED_RTMR1=$TDX_EXPECTED_RTMR1
ENV TDX_EXPECTED_RTMR2=$TDX_EXPECTED_RTMR2
ENV TDX_EXPECTED_RTMR3=$TDX_EXPECTED_RTMR3
ENV TDX_BUILD_GIT_SHA=$TDX_BUILD_GIT_SHA
ENV TDX_BUILD_IMAGE_DIGEST=$TDX_BUILD_IMAGE_DIGEST
ENV TDX_BUILD_TIMESTAMP=$TDX_BUILD_TIMESTAMP

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Install production dependencies only
COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && yarn workspaces focus --production

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/server"]
