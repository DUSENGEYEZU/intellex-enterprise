# Use a smaller base image for production
FROM node:20.18.0-alpine AS build
WORKDIR /app

# Copy only package files first to leverage Docker cache
COPY package*.json ./
RUN npm install --force

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy the rest of your application code
COPY . .

# Build the Angular application
RUN npm run build --prod

# Use a smaller image for production, containing only the built files
FROM node:20.18.0-alpine AS production

WORKDIR /app

# Copy the built files from the build stage
COPY --from=build /app/dist/intellex-web ./dist/client

# Install serve to serve static files
RUN npm install -g serve

# Set environment variables for the port
ENV PORT=3000

# Start the application directly using serve
CMD ["serve", "-s", "./dist/client/browser", "-l", "3000"]