# Serve the pre-built app with nginx
FROM nginx:stable-alpine

# Copy the pre-built dist directory (make sure to run 'npm run build' before docker build)
COPY ./dist /usr/share/nginx/html

# Remove default nginx configuration and replace with a custom one (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
