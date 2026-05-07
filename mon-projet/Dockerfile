# Image runtime uniquement — pas de npm/ng dans Docker (évite les coupures réseau ECONNRESET vers registry.npmjs.org).
# Prérequis avant `docker compose build frontend` :
#   cd mon-projet && npm ci && npm run build -- --configuration production
# En Jenkins : stage « Build frontend (Docker) » avant l’étape compose.

FROM nginx:1.27-alpine

LABEL description="KidneyCare - Frontend Angular"
LABEL version="1.0"

RUN adduser -u 1001 -D nginx 2>/dev/null || true

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/mon-projet/ /usr/share/nginx/html/

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

RUN touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=10 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
