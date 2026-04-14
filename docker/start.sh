#!/bin/bash


# Generate dynamic config.json for Angular

CONFIG_PATH="/app/client/dist/intellex-web/browser/environments"
mkdir -p "$CONFIG_PATH"

cat <<EOF > $CONFIG_PATH/config.json
{
  "apiUrl": "${DOMAIN_HOST:-http://localhost:3003}",
  "unit_api_call_price": ${UNIT_PRICE:-0.00}
}
EOF

echo "Starting NestJS backend on port 9000"
node /app/server/dist/main.js &

echo "Starting Angular frontend on port 9001"
serve -s /app/client/dist/intellex-web/browser -l 9001 &

# Forward environment variables if needed
echo "DOMAIN_HOST is $DOMAIN_HOST"
echo "WEB_CLIENT_URL is $WEB_CLIENT_URL"

# Wait for background jobs
wait