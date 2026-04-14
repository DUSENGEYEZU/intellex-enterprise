# === Stage 1: Build Angular Client ===
FROM node:20.18.0-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --force

# Install Angular CLI
RUN npm install -g @angular/cli

COPY client/ ./
# defaultConfiguration is production in angular.json; be explicit so UI changes always ship in the image
RUN npm run build -- --configuration production

# === Stage 2: Build NestJS Server ===
FROM node:20.18.0-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --force
COPY server/ ./
COPY server/.env .env
RUN npx nest build

# === Stage 3: Final Image with Process Management ===
FROM node:20.18.0-alpine

# Install serve and tini (to manage signals properly)
RUN npm install -g serve && apk add --no-cache bash tini

WORKDIR /app

# Copy frontend build
COPY --from=client-build /app/client/dist /app/client/dist

# Copy backend build and dependencies
COPY --from=server-build /app/server/dist /app/server/dist
COPY --from=server-build /app/server/node_modules /app/server/node_modules
COPY --from=server-build /app/server/package*.json /app/server/
COPY --from=server-build /app/server/.env /app/server/.env

# Copy startup script
COPY docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports: NestJS (9000), Angular (9001)
EXPOSE 9000 9001

# Use tini to manage processes properly
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/start.sh"]