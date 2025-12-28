FROM node:18-alpine
WORKDIR /app

# Copy only package files to install dependencies first (better cache)
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

EXPOSE 3000
CMD ["npm", "start"]