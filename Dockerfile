# ── Stage 1: Build frontend ─────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# ── Stage 2: Production server ──────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY server.js .
COPY levelPrompts.js .

EXPOSE 8080
ENV PORT=8080

CMD ["node", "server.js"]
