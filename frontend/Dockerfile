# ---- Build Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

# Accept the production API URL as a build argument
ARG VITE_API_URL=http://localhost:5005/api
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ---- Serve Stage (Nginx) ----
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
