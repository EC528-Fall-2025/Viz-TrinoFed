# Setting Up the Testing Environment

This guide explains how to run **only the infrastructure services** (Trino, Kafka, PostgreSQL, MongoDB) using Docker, so you can develop and test the Viz-TrinoFed application locally.

---

## What You'll Get

| Service      | Port   | Description                          |
|--------------|--------|--------------------------------------|
| **Trino**    | `8081` | Query engine (UI at http://localhost:8081) |
| **Kafka**    | `9092` | Message broker for query events      |
| **PostgreSQL** | `5433` | Sample relational database         |
| **MongoDB**  | `27018`| Sample document database             |
| **Zookeeper**| `2181` | Required by Kafka (internal)         |

---

## Quick Start

### Step 1: Clone and cd

Clone the github repository:

```bash
git clone https://github.com/EC528-Fall-2025/Viz-TrinoFed.git
cd Viz-TrinoFed
```

### Step 2: Create Your `.env` File

Copy the template to create your environment file:

```bash
cp .env.template .env
```

### Step 3: Verify `.env` Contents

Your `.env` file should contain at minimum:

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=testdb

# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password

# AWS Bedrock (optional - disabled by default)
AWS_BEDROCK_ENABLED=false
```

> **Note:** The default values work out of the box. You only need to change them if you have specific requirements.

### Step 4: Start the Infrastructure

```bash
docker-compose up -d
```

This starts all infrastructure services in the background.

### Step 5: Verify Everything is Running

```bash
docker-compose ps
```

You should see 5 containers running:
- `zookeeper`
- `kafka`
- `postgresql`
- `mongodb`
- `trino`

### Step 6: Test Trino

Open the Trino UI in your browser: **http://localhost:8081**

Or run a test query from the command line:

```bash
docker exec -it trino trino --execute "SHOW CATALOGS"
```

Expected output:
```
postgres
mongodb
system
```
---

## Useful Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f trino
docker-compose logs -f kafka
```

### Stop Services

```bash
# Stop but keep data
docker-compose down

# Stop and remove all data (clean slate)
docker-compose down -v
```

### Restart a Single Service

```bash
docker-compose restart trino
```

### Check Kafka Topics

```bash
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_USER` | Yes | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | Yes | `postgres` | PostgreSQL password |
| `POSTGRES_DB` | Yes | `testdb` | PostgreSQL database name |
| `MONGO_INITDB_ROOT_USERNAME` | Yes | `admin` | MongoDB admin username |
| `MONGO_INITDB_ROOT_PASSWORD` | Yes | `admin123` | MongoDB admin password |
| `AWS_BEDROCK_ENABLED` | No | `false` | Enable AI features |
| `VITE_API_URL` | No* | `/api` | Frontend API URL (*required for local dev) |

---
