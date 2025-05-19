# ---------- 1) BUILD STAGE ----------
FROM node:18-alpine AS builder
WORKDIR /app

# 1.0) Deklarujemy build-arg
ARG NEXT_PUBLIC_API_URL

# 1.1) Ustawiamy go jako ENV tak, by Next.js podczas buildu widział tę zmienną
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 1.2) Skopiuj package.json + lockfile i zainstaluj zależności
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 1.3) Kopiuj resztę kodu i zbuduj
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
