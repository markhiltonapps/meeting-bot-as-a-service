# Express API image for the MeetingBaas viewer.
#
# Build context is this directory (apps/react-app-with-ai-viewer-and-backend).
# The client is deployed separately (Vercel), so only the shared package and the
# api workspace are built here.

FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY client/package.json ./client/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --no-audit --no-fund

COPY . .

RUN npm run shared:build && npm run backend:build

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3080

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/api/package.json ./api/package.json
COPY --from=builder /app/api/node_modules ./api/node_modules
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/api/drizzle ./api/drizzle
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 3080

# Migrations run on boot from api/src/index.ts, so the entrypoint is just the server.
CMD ["node", "api/dist/src/index.js"]
