#!/bin/bash

# Quick Docker Test - Assumes Kafka/Trino are already running

# Configuration

cp .env.standalone .env

# Create config
# cat > .env << EOF
# KAFKA_HOST=kafka:29092
# KAFKA_TOPIC=trino-query-events
# BACKEND_PORT=8080
# FRONTEND_PORT=3000
# AWS_BEDROCK_ENABLED=false
# EOF

# Build and start
docker-compose -f docker-compose.standalone.yml build
echo "Building containers..."

sleep 30

docker-compose -f docker-compose.standalone.yml up -d

echo "Starting containers..."

# Wait for startup
sleep 30

# Show status
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8080"
echo ""
echo "Check logs: docker-compose -f docker-compose.standalone.yml logs -f"
echo "Stop: docker-compose -f docker-compose.standalone.yml down"