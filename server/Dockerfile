# Use the official Node.js image with Alpine
FROM node:20.18.0-alpine AS build

# Set the working directory
WORKDIR /usr/src/app

# Set NODE_ENV to development for the build stage
ENV NODE_ENV=development

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install --force

# Copy the rest of the application code
COPY . .

# Copy the .env file
COPY .env .env

# Build the application using npx
RUN npx nest build

# Start a new stage for the production image
FROM node:20.18.0-alpine AS production

# Set the working directory
WORKDIR /usr/src/app

# Set NODE_ENV to production for the production stage
ENV NODE_ENV=production

# Copy only the build artifacts and dependencies from the build stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy the .env file to the production image
COPY --from=build /usr/src/app/.env .env

# Expose the application port
EXPOSE 3003

# Command to run the application
CMD ["node", "dist/main.js"]
