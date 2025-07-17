# 1. Use official Node.js image as the build environment
FROM node:18-alpine AS builder

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json and package-lock.json
COPY package.json ./
# COPY package-lock.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the application code
COPY . .

ENV NODE_ENV=production
ENV NEXT_PUBLIC_DJANGO_ADMIN_PROTOCOL=http
ENV NEXT_PUBLIC_DJANGO_ADMIN_DOMAIN=192.168.1.100

# 6. Build the Next.js app
RUN npm run build

# 7. Production image, copy built assets and install only production dependencies
FROM node:18-alpine AS runner

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package.json ./
# COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port 3000
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"] 