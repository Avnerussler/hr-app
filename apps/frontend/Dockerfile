# Step 1: Build the app
FROM node:18 AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Step 2: Serve the app with a lightweight web server
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default nginx configuration and replace with a custom one (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
