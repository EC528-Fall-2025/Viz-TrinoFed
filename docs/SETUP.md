# 🚀 Kafka-Integrated Backend Setup Guide

This branch implements a **Spring Boot backend** that consumes Trino query events from Kafka and exposes REST APIs for query visualization.

---

## 📋 Table of Contents
- [What This Does](#what-this-does)
- [Why We Built This](#why-we-built-this)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Loading Sample Data](#loading-sample-data)
- [Testing the System](#testing-the-system)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

---

## 🎯 What This Does

This system **tracks and monitors Trino queries** in real-time:

1. **Trino** executes SQL queries and publishes events to **Kafka**
2. **Spring Boot Backend** consumes these events and parses them
3. **REST APIs** expose query data for visualization
4. **Future Frontend** will display this data in charts and graphs

### What You Get:
- 📊 Real-time query tracking
- ⏱️ Performance metrics (execution time, CPU time, memory usage)
- 📝 Full query execution plans
- 👤 User and session information
- 🔍 Query history and status

---

## 🤔 Why We Built This

**Problem:** Trino doesn't provide built-in query visualization. Understanding query performance and execution flow is difficult.

**Solution:** This system captures every query Trino executes and makes the data accessible via REST APIs, enabling:
- Performance monitoring
- Query optimization
- Execution plan visualization
- Resource usage tracking

---

## 🏗️ Architecture Overview

```
┌─────────────┐
│   Trino     │ Executes SQL queries
│  (Port 8081)│
└──────┬──────┘
       │ Publishes events
       ↓
┌─────────────┐
│    Kafka    │ Message queue
│  (Port 9092)│
└──────┬──────┘
       │ Streams events
       ↓
┌─────────────┐
│  Backend    │ Parses & stores
│  (Port 8080)│ Spring Boot + Java 21
└──────┬──────┘
       │ REST APIs
       ↓
┌─────────────┐
│   Future    │ Visualization
│  Frontend   │ React (coming soon)
└─────────────┘
```

### Services:
- **Kafka + Zookeeper**: Event streaming
- **PostgreSQL**: Sample data source for Trino
- **MongoDB**: Sample data source for Trino
- **Trino**: Query engine being monitored
- **Backend**: Event consumer and API server

---

## ✅ Prerequisites

### Required:
- **Docker Desktop** (for running services)
- **Java 21** (for backend)
  ```bash
  # Check Java version
  java -version  # Should show 21.x.x

  # Install Java 21 (macOS with Homebrew)
  brew install openjdk@21
  ```
- **Maven** (for building backend)
  ```bash
  mvn --version
  ```

### Optional:
- **jq** (for pretty JSON output)
  ```bash
  brew install jq
  ```

---

## 🚀 Quick Start

### Step 1: Clone and Navigate
```bash
git clone https://github.com/EC528-Fall-2025/Viz-TrinoFed.git
cd Viz-TrinoFed
git checkout feature/kafka-backend-integration
```

### Step 2: Set Up Environment Variables
```bash
# Copy template
cp .env.template .env

# .env should contain:
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=password
# POSTGRES_DB=testdb
# MONGO_INITDB_ROOT_USERNAME=admin
# MONGO_INITDB_ROOT_PASSWORD=password
```

### Step 3: Start Docker Services
```bash
# Start all services (Kafka, Trino, PostgreSQL, MongoDB)
docker-compose up -d

# Verify all services are running
docker ps
# Should show 5 containers: kafka, zookeeper, trino, postgresql, mongodb
```

**Wait 30 seconds** for all services to initialize.

### Step 4: Start Backend
```bash
cd backend

# Option 1: Using helper script (sets Java 21 automatically)
./run.sh

# Option 2: Using Maven directly
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
mvn spring-boot:run
```

**Backend will start on http://localhost:8080**

Look for this message:
```
Started TrinoKafkaParserApplication in X.XXX seconds
```

---

## 🧪 Testing the System

### Option 1: Run Test Script (Easiest)
```bash
# From project root
./test-query.sh
```

This will:
1. Execute a test query on Trino
2. Wait for Kafka to process events
3. Show all captured query IDs
4. Display full query details

### Option 2: Manual Testing
```bash
# 1. Run a Trino query
docker exec trino trino --execute "SELECT 'Hello Trino' AS greeting, 42 AS answer"

# 2. Wait a few seconds for processing
sleep 3

# 3. Check if query was captured
curl http://localhost:8080/api/queries/ids
# Should return: ["20251002_XXXXXX_XXXXX_XXXXX"]

# 4. Get full query details
curl http://localhost:8080/api/queries | jq '.'
```

---

## 📡 API Endpoints

### 1. Get All Query IDs
```bash
GET http://localhost:8080/api/queries/ids
```
**Returns:** Array of query IDs
```json
["20251002_200813_00003_sb834"]
```

### 2. Get All Queries with Details
```bash
GET http://localhost:8080/api/queries
```
**Returns:** Array of query objects with full details
```json
[
  {
    "queryId": "20251002_200813_00003_sb834",
    "query": "SELECT 'Final test' AS message, current_timestamp",
    "user": "trino",
    "state": "FINISHED",
    "startTime": "2025-10-02T20:08:13.884Z",
    "endTime": "2025-10-02T20:08:13.934Z",
    "events": [...],
    "plan": "Trino version: 477..."
  }
]
```

### 3. Get Specific Query by ID
```bash
GET http://localhost:8080/api/queries/{queryId}
```
**Returns:** Single query object

---

## 🔍 What Data Is Captured?

For each query, we capture:

### Basic Info:
- Query ID (unique identifier)
- SQL query text
- User who ran the query
- Query state (QUEUED, RUNNING, FINISHED, FAILED)

### Timestamps:
- Start time
- End time
- Create time

### Performance Metrics:
- CPU time (milliseconds)
- Wall time (total elapsed time)
- Queued time (time waiting to execute)
- Peak memory usage (bytes)

### Execution Details:
- Full execution plan
- Number of completed splits
- Input/output data sizes
- Operator statistics

---

## 🛠️ Troubleshooting

### Problem: Backend won't start
**Error:** `Port 8080 already in use`

**Solution:**
```bash
# Kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Restart backend
cd backend && ./run.sh
```

---

### Problem: "Java version mismatch"
**Error:** `Unsupported class file major version`

**Solution:**
```bash
# Set Java 21 explicitly
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
mvn clean install
mvn spring-boot:run
```

---

### Problem: Docker containers not starting
**Error:** `Cannot connect to Docker daemon`

**Solution:**
1. Start Docker Desktop
2. Wait for it to fully start
3. Retry: `docker-compose up -d`

---

### Problem: No queries appearing in API
**Possible causes:**

1. **Backend not connected to Kafka**
   ```bash
   # Check backend logs for:
   # "Successfully joined group with generation"
   ```

2. **No queries have been executed yet**
   ```bash
   # Run a test query
   docker exec trino trino --execute "SELECT 1"
   ```

3. **Kafka not receiving events**
   ```bash
   # Check Trino logs
   docker logs trino | grep -i kafka
   ```

---

### Problem: Permission denied on files
**Error:** `permission denied: trino/etc/event-listener.properties`

**Solution:**
```bash
# Fix file permissions
chmod 644 trino/etc/event-listener.properties
chmod 644 trino/etc/catalog/mongodb.properties
```

---

## 📁 Project Structure

```
Viz-TrinoFed/
├── backend/                          # Spring Boot application
│   ├── src/main/java/.../
│   │   ├── consumer/                 # Kafka consumer
│   │   │   └── TrinoEventConsumer.java
│   │   ├── model/                    # Data models
│   │   │   ├── QueryEvent.java      # Clean query format
│   │   │   ├── QueryTree.java       # Tree structure
│   │   │   └── TrinoEventWrapper.java # Parses Trino events
│   │   ├── service/                  # Business logic
│   │   │   └── QueryEventService.java
│   │   └── controller/               # REST APIs
│   │       └── QueryController.java
│   ├── pom.xml                       # Maven dependencies
│   └── run.sh                        # Helper script
├── trino/
│   └── etc/
│       ├── catalog/                  # Data source configs
│       │   ├── mongodb.properties
│       │   └── postgresql.properties
│       ├── config.properties         # Trino settings
│       └── event-listener.properties # Kafka integration
├── docker-compose.yml                # All services
├── test-query.sh                     # Test script
└── README.md                         # This file
```

---

## 🔄 How It Works

### 1. Query Execution
When you run a SQL query:
```sql
SELECT 'Hello' AS greeting FROM users;
```

### 2. Event Publishing
Trino publishes **2 events** to Kafka:
- **CREATED**: Query started (state: QUEUED)
- **COMPLETED**: Query finished (state: FINISHED/FAILED)

### 3. Event Format (Raw from Kafka)
```json
{
  "eventPayload": {
    "metadata": {
      "queryId": "20251002_200813_00003_sb834",
      "query": "SELECT...",
      "queryState": "FINISHED"
    },
    "context": {
      "user": "trino"
    },
    "statistics": {
      "cpuTime": "0.001s",
      "wallTime": "0.045s"
    }
  }
}
```

### 4. Backend Processing
`TrinoEventWrapper` parses the nested structure and converts to clean format:
```json
{
  "queryId": "20251002_200813_00003_sb834",
  "query": "SELECT...",
  "user": "trino",
  "state": "FINISHED",
  "cpuTimeMs": 1,
  "wallTimeMs": 45
}
```

### 5. API Access
Query data is now available via REST API at `/api/queries`

---

## 🎯 Next Steps

1. ✅ **Backend is complete** - You're here!
2. 🔜 **Build React Frontend** - Visualize query data
3. 🔜 **Add WebSocket Support** - Real-time updates
4. 🔜 **Parse Execution Plans** - Visual query trees
5. 🔜 **Add Filtering/Search** - Query history UI

---

## 🤝 Contributing

When working on this branch:

1. **Test your changes:**
   ```bash
   ./test-query.sh
   ```

2. **Check API responses:**
   ```bash
   curl http://localhost:8080/api/queries
   ```

3. **Verify all services are running:**
   ```bash
   docker ps  # Should show 5 containers
   ```

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review backend logs for errors
3. Verify Docker services are running
4. Check port availability (8080, 8081, 9092)

---

## 🎉 Success!

If you see query data when visiting `http://localhost:8080/api/queries`, congratulations! Your system is working perfectly. 🚀

The backend is production-ready and waiting for the frontend visualization layer!
