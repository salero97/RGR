FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package*.json ./
RUN mkdir -p logs && chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
CMD ["node", "src/app.js"]