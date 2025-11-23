# Docker Installation Guide

## Overview

This guide will help you install and run the Viz-TrinoFed visualization application using Docker. This application connects to your existing Kafka and Trino infrastructure to visualize query execution.

## Prerequisites

Before starting, ensure you have:

- Docker and Docker Compose installed on your system
- Kafka running and accessible (with Trino query events being published)
- Trino instance configured with Kafka event listener

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/EC528-Fall-2025/Viz-TrinoFed.git
cd Viz-TrinoFed
```

### 2. Configure Kafka Connection

Create a `.env` file from the template:

```bash
cp .env.standalone .env
```

Edit the `.env` file with your Kafka configuration:

```bash
# Kafka Configuration
KAFKA_HOST=kafka:29092
KAFKA_TOPIC=trino-query-events

# Application Ports
BACKEND_PORT=8080
FRONTEND_PORT=3000

# AWS Bedrock (Optional)
AWS_BEDROCK_ENABLED=false
```

**Important:** Update `KAFKA_HOST` based on your setup:
- If Kafka is in Docker: `kafka:29092` or `kafka:9092`
- If Kafka is on host machine: `host.docker.internal:9092`
- If Kafka is remote: `your-kafka-server.com:9092`

### 3. Update Network Configuration

Find your Kafka Docker network name:

```bash
docker network ls | grep trino
```

Edit `docker-compose.standalone.yml` and update the network name in the `networks` section at the bottom:

```yaml
networks:
  viz-network:
    driver: bridge
  YOUR_NETWORK_NAME:  # Replace with actual network name from above
    external: true
```

Also update the backend service networks section:

```yaml
services:
  backend:
    # ... other config ...
    networks:
      - viz-network
      - YOUR_NETWORK_NAME  # Replace with actual network name
```

### 4. Build and Start

Build the Docker images:

```bash
docker-compose -f docker-compose.standalone.yml build
```

This may take 5-10 minutes on the first build.

Start the application:

```bash
docker-compose -f docker-compose.standalone.yml up -d
```

Wait 20-30 seconds for services to initialize.

### 5. Verify Installation

Check that containers are running:

```bash
docker-compose -f docker-compose.standalone.yml ps
```

Both `viz-trinofed-backend` and `viz-trinofed-frontend` should show status "Up".

Check backend logs for Kafka connection:

```bash
docker-compose -f docker-compose.standalone.yml logs backend | grep -i kafka
```

You should see successful connection messages, not errors.

### 6. Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

The visualization interface should load. Run a query in Trino to see it appear in the visualization.

## Configuration Options

### Custom Ports

To change the ports, edit your `.env` file:

```bash
BACKEND_PORT=8090
FRONTEND_PORT=3001
```

Then restart:

```bash
docker-compose -f docker-compose.standalone.yml restart
```

### Kafka Topic Name

If your Trino events are published to a different topic:

```bash
KAFKA_TOPIC=your-custom-topic-name
```

### AWS Bedrock AI Features

To enable AI-powered query analysis, configure AWS credentials:

```bash
AWS_BEDROCK_ENABLED=true
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## Common Commands

### View logs

```bash
# All logs
docker-compose -f docker-compose.standalone.yml logs

# Backend only
docker-compose -f docker-compose.standalone.yml logs backend

# Follow logs in real-time
docker-compose -f docker-compose.standalone.yml logs -f
```

### Restart services

```bash
docker-compose -f docker-compose.standalone.yml restart
```

### Stop services

```bash
docker-compose -f docker-compose.standalone.yml down
```

### Rebuild after code changes

```bash
docker-compose -f docker-compose.standalone.yml build --no-cache
docker-compose -f docker-compose.standalone.yml up -d
```

## Troubleshooting

### Backend cannot connect to Kafka

**Symptom:** Logs show "Connection to node X could not be established"

**Solution:**
1. Verify Kafka is running: `docker ps | grep kafka`
2. Check your `KAFKA_HOST` setting in `.env`
3. Verify the backend container is on the same Docker network as Kafka
4. Test connectivity: `docker-compose -f docker-compose.standalone.yml exec backend nc -zv kafka 29092`

### Frontend shows 404 errors

**Symptom:** Browser console shows "404 Not Found" for API requests

**Solution:**
1. Check backend is running: `docker-compose -f docker-compose.standalone.yml ps`
2. Verify nginx configuration is correct
3. Check backend logs: `docker-compose -f docker-compose.standalone.yml logs backend`

### No queries appear in visualization

**Symptom:** Application loads but no queries are displayed

**Solution:**
1. Verify Trino is publishing events to Kafka
2. Check the topic name matches: `docker exec kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic trino-query-events --from-beginning --max-messages 1`
3. Ensure backend successfully connected to Kafka (check logs)
4. Run a test query in Trino and wait 5-10 seconds

### Port already in use

**Symptom:** Error starting containers due to port conflict

**Solution:**
1. Change ports in `.env` file
2. Or stop the conflicting service
3. Check what's using the port: `lsof -i :3000` (macOS/Linux)

### Docker network not found

**Symptom:** "network X declared as external, but could not be found"

**Solution:**
1. Find the correct network name: `docker network ls`
2. Update `docker-compose.standalone.yml` with the actual network name
3. Ensure your Kafka/Trino infrastructure is running

## Testing the Installation

To verify everything works correctly:

1. Open the application: `http://localhost:3000`
2. Connect to your Trino instance
3. Run a query:
   ```sql
   SELECT * FROM your_catalog.your_schema.your_table LIMIT 10;
   ```
4. The query should appear in the visualization within seconds
5. Click on the query to see the execution tree

## Uninstalling

To completely remove the application:

```bash
# Stop and remove containers
docker-compose -f docker-compose.standalone.yml down

# Remove images
docker rmi viz-trinofed-frontend viz-trinofed-backend

# Remove the project directory
cd ..
rm -rf Viz-TrinoFed
```