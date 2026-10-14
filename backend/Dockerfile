# ==========================================
# Stage 1: Build source code
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy lockfile trước để tận dụng Docker layer cache
COPY package*.json ./

# Cài toàn bộ dependencies để build (kèm devDependencies)
# --ignore-scripts giảm thiểu rủi ro bảo mật trừ khi project cần build native addon
RUN npm ci

COPY . .

RUN npm run build

# ==========================================
# Stage 2: Cài production dependencies
# ==========================================
FROM node:22-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./

# Chỉ cài production dependencies và dọn sạch cache ngay trong cùng một layer
RUN npm ci --omit=dev && npm cache clean --force

# ==========================================
# Stage 3: Runtime image cuối cùng
# ==========================================
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules sạch từ stage prod-deps
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Chạy với user non-root có sẵn của Alpine để đảm bảo an toàn vận hành
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]