#!/bin/sh
set -e

# Default backend host if not specified
: "${BACKEND_HOST:=backend:8080}"

# Generate nginx config from template using envsubst
# Only substitute BACKEND_HOST to avoid replacing nginx's own $ variables
envsubst '${BACKEND_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Nginx configured with BACKEND_HOST=${BACKEND_HOST}"

# Start nginx
exec nginx -g 'daemon off;'

