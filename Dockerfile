# syntax=docker/dockerfile:1

# ------------------
# 1) Base deps
# ------------------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ------------------
# 2) Build stage
# ------------------
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Bake placeholder values for NEXT_PUBLIC_* vars
ENV NEXT_PUBLIC_REDIRECT_URL=__NEXT_PUBLIC_REDIRECT_URL__
ENV NEXT_PUBLIC_CW_LOGIN_URL=__NEXT_PUBLIC_CW_LOGIN_URL__
ENV NEXT_PUBLIC_CW_APP_URL=__NEXT_PUBLIC_CW_APP_URL__
ENV NEXT_PUBLIC_CW_DOMAIN=__NEXT_PUBLIC_CW_DOMAIN__

RUN npm run build

# ------------------
# 3) Runtime
# ------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Ensure runtime user can write to .next files for env injection
RUN chown -R nextjs:nodejs /app

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
USER nextjs
CMD ["node", "server.js"]
