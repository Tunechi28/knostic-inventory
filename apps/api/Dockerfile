# Build stage
FROM node:20.15.0-alpine AS development

WORKDIR /usr/src/app

COPY package.json nx.json tsconfig.base.json ./
RUN npm install --legacy-peer-deps --fetch-retries=5 --fetch-retry-mintimeout=20000

COPY . .

EXPOSE 4000
CMD ["npx", "nx", "serve", "api", "--skip-nx-cache"]
