# ============================================
# Dockerfile pour Frontend Angular
# ============================================

# Stage 1 : Build Angular (bookworm-slim = glibc, moins de surprises CI qu’Alpine pour npm/ng)
FROM node:20-bookworm-slim AS builder

WORKDIR /build

ENV NODE_OPTIONS=--max-old-space-size=6144

# Copier les fichiers de configuration
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build pour production
RUN npm run build -- --configuration production

# ============================================
# Stage 2 : Runtime Nginx
FROM nginx:1.27-alpine

LABEL description="KidneyCare - Frontend Angular"
LABEL version="1.0"

# Créer un utilisateur non-root
RUN adduser -u 1001 -D nginx || true

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier l'application construite
COPY --from=builder /build/dist/mon-projet/browser /usr/share/nginx/html

# Changer les permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Créer les fichiers de cache et log
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

# Health check (laisser le temps à Nginx de démarrer avant de marquer unhealthy)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=10 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
