FROM node:20-alpine AS base

# Build client
FROM base AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# Production
FROM base AS production
WORKDIR /app

# Server dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Prisma
COPY server/prisma ./prisma
RUN npx prisma generate

# Server source
COPY server/src ./src

# Copy built client
COPY --from=client-build /app/client/dist ./public

# Create uploads dir
RUN mkdir -p uploads

# Serve static files from Express in production
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
