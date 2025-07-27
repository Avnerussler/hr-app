# Use Node.js official LTS image as base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the entire dist directory
COPY ./dist ./dist

# PORT the application runs on
ENV PORT=3001

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["node", "dist/server.js"]
