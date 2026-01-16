# Docker Deployment Guide

## Prerequisites
- Docker installed
- Docker Compose installed

## Quick Start

1. **Set up environment variables:**
   ```bash
   cp .env.docker .env
   # Edit .env with your actual values
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000

## Individual Container Commands

### Build Backend Only
```bash
cd backend
docker build -t shadman-housing-backend .
docker run -p 5000:5000 --env-file ../.env shadman-housing-backend
```

### Build Frontend Only
```bash
docker build -t shadman-housing-frontend .
docker run -p 8080:80 shadman-housing-frontend
```

## Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View running containers
docker-compose ps
```

## Health Checks

Both services include health checks:
- Backend: Checks if API is responding
- Frontend: Checks if nginx is serving content

## Volumes

- `./backend/public/signatures` - Mounted to persist signature files

## Network

All services run on a shared network: `shadman-housing-network`

## Production Deployment

For production:
1. Update JWT secrets in `.env`
2. Use production database URL
3. Consider using Docker secrets for sensitive data
4. Set up SSL/TLS certificates
5. Configure proper nginx settings for your domain

## Troubleshooting

### View container logs
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Restart a service
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Check container health
```bash
docker-compose ps
```
