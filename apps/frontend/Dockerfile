FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package.json nx.json tsconfig.base.json ./
RUN npm install --legacy-peer-deps --fetch-retries=5 --fetch-retry-mintimeout=20000

COPY . .

# Build the frontend
RUN npx nx build frontend

# Production stage
FROM nginx:alpine

# Copy build output to nginx
COPY --from=build /usr/src/app/dist/apps/frontend /usr/share/nginx/html

# Copy nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
