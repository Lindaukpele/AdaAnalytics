# Use official Node.js runtime
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your code
COPY . .

# Expose port (Render will use $PORT)
EXPOSE 3000

# Start your server
CMD ["npm", "start"]