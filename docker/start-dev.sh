echo "Starting NestJS backend on port 3001"
node ../server/dist/main.js &

echo "Starting Angular frontend on port 3000"
serve -s ../client/dist/intellex-web/browser -l 3000 &


# Forward environment variables if needed
echo "DOMAIN_HOST is $DOMAIN_HOST"
echo "WEB_CLIENT_URL is $WEB_CLIENT_URL"

# Wait for background jobs
wait