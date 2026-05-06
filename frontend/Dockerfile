FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV VITE_API_BASE=/automatisierung-tool-api

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html/automatisierung-tool
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
