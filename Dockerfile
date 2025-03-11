FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json .

ENV NODE_ENV=production
RUN npm install --no-dev

FROM node:20-alpine
WORKDIR /app

COPY --from=base /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist

ENV APP_PORT=3000

EXPOSE 3000

ENTRYPOINT [ "node", "./dist/index.js" ]