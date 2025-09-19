# frontend/Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
# CMD ["npm", "run", "dev", "--", "--host"]
CMD ["npm", "run", "dev", "--", "-p", "5173"]
# CMD ["npm", "run", "dev", "--", "-p", "5173", "-H", "0.0.0.0"]
# CMD ["npx", "next", "dev", "-p", "5173", "-H", "0.0.0.0"]

