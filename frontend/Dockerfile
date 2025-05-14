# ---------- 1) BUILD STAGE ----------
FROM node:18-alpine AS builder
WORKDIR /app

# 1.1) Skopiuj package.json + lockfile i zainstaluj zależności
COPY package.json package-lock.json ./
# → tu dodajemy legacy-peer-deps, żeby npm nie wywalał błędem
RUN npm ci --legacy-peer-deps

# 1.2) Kopiuj resztę kodu i zbuduj
COPY . .
RUN npm run build

# ---------- 2) PRODUCTION STAGE ----------
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
