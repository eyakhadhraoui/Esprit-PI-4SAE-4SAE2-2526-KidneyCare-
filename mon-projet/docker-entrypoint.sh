#!/bin/sh
# Docker entrypoint script for environment variable substitution

set -e

# Default values if not set
export GATEWAY_HOST=${GATEWAY_HOST:-gateway:8095}
export KEYCLOAK_HOST=${KEYCLOAK_HOST:-keycloak:8080}

# Create nginx config from template
envsubst '${GATEWAY_HOST},${KEYCLOAK_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the command
exec "$@"
