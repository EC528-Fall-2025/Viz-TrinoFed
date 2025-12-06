# Docker Installation Guide

## Overview

Viz-TrinoFed provides real-time visualization of Trino query execution. This guide shows you how to run it using pre-built Docker images - no cloning or building required.

## Prerequisites

- Docker and Docker Compose installed
- Kafka running with Trino query events being published
- Trino instance configured with Kafka event listener

## Quick Start (3 Steps)

### 1. Download the Compose File

```bash
curl -O https://github.com/EC528-Fall-2025/Viz-TrinoFed/main/docker-compose.user.yml
```

### 2. Start the Application

**If Kafka is running in Docker** (most common):

First, find your Kafka network name:
```bash
docker network ls | grep -E "(trino|kafka)"
```

Then start with the network specified:
```bash
KAFKA_NETWORK=your_network_name KAFKA_HOST=kafka:29092 \
  docker-compose -f docker-compose.user.yml up -d
```

**If Kafka is running on your host machine and not an image**:
```bash
KAFKA_HOST=host.docker.internal:9092 docker-compose -f docker-compose.user.yml up -d
```

### 3. Open the Application

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

That's it! Run a query in Trino and it will appear in the visualization.

---

## Configuration

### Required: Kafka Connection

Set `KAFKA_HOST` to point to your Kafka broker:

| Your Setup | KAFKA_HOST Value |
|------------|------------------|
| Kafka on same machine | `host.docker.internal:9092` |
| Kafka in Docker (same network) | `kafka:29092` |
| Remote Kafka server | `your-kafka.example.com:9092` |

### Optional: AI-Powered Analysis

Enable AWS Bedrock for intelligent query optimization suggestions:

```bash
KAFKA_HOST=localhost:9092 \
AWS_BEDROCK_ENABLED=true \
AWS_BEDROCK_MODEL_ID=your_model_id \
AWS_REGION=us-east-1 \
AWS_ACCESS_KEY_ID=your_key \
AWS_SECRET_ACCESS_KEY=your_secret \
  docker-compose -f docker-compose.user.yml up -d
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KAFKA_HOST` | Yes | `host.docker.internal:9092` | Kafka bootstrap servers |
| `KAFKA_NETWORK` | If Kafka in Docker | `viz-trinofed_trino-network` | Docker network where Kafka runs |
| `KAFKA_TOPIC` | No | `trino-query-events` | Kafka topic for Trino events |
| `FRONTEND_PORT` | No | `3000` | Port to access the web UI |
| `BACKEND_PORT` | No | `8080` | Port for the backend API |
| `AWS_BEDROCK_ENABLED` | No | `false` | Enable AI features |
| `AWS_BEDROCK_MODEL_ID` | No | `us.anthropic.claude-sonnet-4-5-20250929-v1:0` | Model to perform analysis |
| `AWS_REGION` | No | `us-east-1` | AWS region (if AI enabled) |
| `AWS_ACCESS_KEY_ID` | Yes (if AI enabled) | - | AWS credentials (if AI enabled) |
| `AWS_SECRET_ACCESS_KEY` | Yes (if AI enabled) | - | AWS credentials (if AI enabled) |

---

## Common Commands

### View logs

```bash
# All logs
docker-compose -f docker-compose.user.yml logs

# Backend only
docker-compose -f docker-compose.user.yml logs backend

# Follow logs in real-time
docker-compose -f docker-compose.user.yml logs -f
```

### Check container status

```bash
docker-compose -f docker-compose.user.yml ps
```

### Restart services

```bash
docker-compose -f docker-compose.user.yml restart
```

### Stop services

```bash
docker-compose -f docker-compose.user.yml down
```

### Update to latest version

```bash
docker-compose -f docker-compose.user.yml pull
docker-compose -f docker-compose.user.yml up -d
```

---

## Troubleshooting

### Backend cannot connect to Kafka

**Symptom:** Logs show "Connection to node X could not be established" or "No resolvable bootstrap urls"

**Solutions:**
1. Verify Kafka is running: `docker ps | grep kafka`
2. **If Kafka is in Docker**: You must set `KAFKA_NETWORK` to the network where Kafka runs:
   ```bash
   # Find your Kafka network
   docker network ls | grep -E "(trino|kafka)"
   
   # Start with the network specified
   KAFKA_NETWORK=your_network_name KAFKA_HOST=kafka:29092 \
     docker-compose -f docker-compose.user.yml up -d
   ```
3. **If Kafka is on your host machine**: Use `host.docker.internal:9092`
4. Check backend logs: `docker-compose -f docker-compose.user.yml logs backend`

### No queries appear in visualization

**Symptom:** Application loads but no queries are displayed

**Solutions:**
1. Verify Trino is publishing events to Kafka
2. Ensure the topic name matches (`KAFKA_TOPIC` default is `trino-query-events`)
3. Run a test query in Trino and wait a few seconds
4. Check backend logs for Kafka connection status

### Port already in use

**Symptom:** Error starting containers due to port conflict

**Solutions:**
1. Use custom ports: `FRONTEND_PORT=3001 BACKEND_PORT=8081`
2. Or find what's using the port: `lsof -i :3000` (macOS/Linux)
3. Stop the conflicting service

### Cannot connect to localhost:3000

**Symptom:** Browser shows "connection refused"

**Solutions:**
1. Check containers are running: `docker-compose -f docker-compose.user.yml ps`
2. Verify the frontend container started: `docker logs viz-trinofed-frontend`
3. Try a different port if 3000 is blocked

---

## Uninstalling

```bash
# Stop and remove containers
docker-compose -f docker-compose.user.yml down

# Remove downloaded images (optional)
docker rmi viztrinofed/viz-trinofed-frontend viztrinofed/viz-trinofed-backend

# Remove compose file
rm docker-compose.user.yml
```

---

## Advanced: Building from Source

If you need to build the images yourself (for development or customization):

```bash
# Clone the repository
git clone https://github.com/EC528-Fall-2025/Viz-TrinoFed.git
cd Viz-TrinoFed

# Build images
docker build -t viztrinofed/viz-trinofed-frontend:latest .
docker build -t viztrinofed/viz-trinofed-backend:latest ./backend

# Run using the user compose file
KAFKA_HOST=localhost:9092 docker-compose -f docker-compose.user.yml up -d
```