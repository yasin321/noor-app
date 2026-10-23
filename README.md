# Noor App - Containerized React/TypeScript Application

A modern web/mobile application built with **React**, **TypeScript**, **Vite**, and **Supabase**, fully containerized for production deployment.

## DevOps & Infrastructure Highlights
- **Multi-Stage Docker Build:** Uses `node:20-alpine` for building static assets and lightweight `nginx:alpine` for serving production traffic.
- **CI/CD Ready:** Integrated with automated workflows (`.github/workflows`) for cloud build and deployment.

## Quick Start with Docker
```bash
# Build the Docker image
docker build -t noor-app:latest .

# Run the container on port 8080
docker run -d -p 8080:80 --name noor-web noor-app:latest
