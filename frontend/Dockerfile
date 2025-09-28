# frontend/Dockerfile
FROM node:18

WORKDIR /app

# Install deps first
COPY package*.json ./
RUN npm install

# Copy config files so PostCSS/Tailwind works in Docker
COPY tailwind.config.js postcss.config.js jsconfig.json ./

# Copy everything else
COPY . .

RUN npm run build

# Run frontend on port 5173 (not 3000!)
EXPOSE 5173

# Use npm dev with explicit port & host
CMD ["npm", "start", "--", "-p", "5173", "-H", "0.0.0.0"]
