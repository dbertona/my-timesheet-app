# Etapa de build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Etapa de runtime con Nginx
FROM nginx:alpine
# Configuración Nginx para SPA
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# Copiar artefactos de build
COPY --from=build /app/dist /usr/share/nginx/html
# Salud básica
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ || exit 1
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
