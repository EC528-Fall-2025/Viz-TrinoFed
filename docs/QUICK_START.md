# Quick Start Guide

**For users who want to start immediately from source without reading the full guide.**

---

## Quick Startup

### Prerequisites
- Docker Desktop installed
- Java 22 installed
- Node.js and npm installed

### Step 1: Clone and Start Docker (30 seconds)
```bash
git clone https://github.com/EC528-Fall-2025/Viz-TrinoFed.git
cd Viz-TrinoFed
docker-compose up -d
sleep 30  # Wait for services to start
```

### Step 2: Start Backend (in new terminal)
```bash
cd backend
JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn spring-boot:run
```
Wait for: "Started TrinoKafkaParserApplication"

### Step 3: Start Frontend (in another new terminal)
```bash
cd Viz-TrinoFed
npm run dev
```
Wait for: "Local: http://localhost:5173/"

### Step 4: Test with Query (in another new terminal)
```bash
docker exec -it trino trino
```
Then run:
```sql
SELECT * FROM postgres.public.customers LIMIT 5;
```

### Step 5: View Results
Open: http://localhost:5173

---

## What You Should See

**Backend logs:**
```
INFO: Parsing query tree from JSON plan for query: ...
INFO: Successfully parsed JSON plan with operator: TableScan
```

**Frontend:**
- Database node (PostgreSQL) on left
- Query tree with operators
- Metrics displayed (not null)

---

## Quick Shutdown

From the root directory:
```bash
# Terminal 1 (Backend): Ctrl+C
# Terminal 2 (Frontend): Ctrl+C
# Terminal 3 (Trino): Type 'quit'
# Terminal 4:
cd docker-compose down
```
