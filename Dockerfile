FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Default port (platforms may override via $PORT)
EXPOSE 3000

CMD ["node", "server.js"]
