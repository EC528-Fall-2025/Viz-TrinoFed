# Viz-TrinoFed Shutdown & Startup Guide

## 🛑 Complete Shutdown Instructions

### **Method 1: Automated Shutdown (Recommended)**

```bash
# Navigate to project directory
cd /Users/lizhengyuan/Viz-TrinoFed

# Stop all Docker containers
docker-compose down

# Find and stop backend (if running)
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill 2>/dev/null

# Find and stop frontend (if running)
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill 2>/dev/null
```

### **Method 2: Manual Shutdown (Step-by-Step)**

#### **Step 1: Stop Frontend**

**If running in terminal:**
- Go to the terminal where `npm run dev` is running
- Press `Ctrl+C`

**If running in background:**
```bash
lsof -i :5173 | grep LISTEN
# Note the PID (second column)
kill <PID>

# Example:
# lsof -i :5173 | grep LISTEN
# node    36485 lizhengyuan ...
kill 36485
```

**Verify frontend stopped:**
```bash
lsof -i :5173 || echo "Frontend stopped ✓"
```

---

#### **Step 2: Stop Backend**

**If running in terminal:**
- Go to the terminal where `mvn spring-boot:run` is running
- Press `Ctrl+C`

**If running in background:**
```bash
lsof -i :8080 | grep LISTEN
# Note the PID (second column)
kill <PID>

# Example:
# lsof -i :8080 | grep LISTEN
# java    36126 lizhengyuan ...
kill 36126
```

**Verify backend stopped:**
```bash
lsof -i :8080 || echo "Backend stopped ✓"
```

---

#### **Step 3: Stop Docker Services**

```bash
cd /Users/lizhengyuan/Viz-TrinoFed
docker-compose down
```

**Expected output:**
```
Container trino       Stopping
Container trino       Stopped
Container trino       Removed
Container postgresql  Stopping
Container postgresql  Stopped
Container postgresql  Removed
Container mongodb     Stopping
Container mongodb     Stopped
Container mongodb     Removed
Container kafka       Stopping
Container kafka       Stopped
Container kafka       Removed
Container zookeeper   Stopping
Container zookeeper   Stopped
Container zookeeper   Removed
Network viz-trinofed_trino-network  Removed
```

**Verify Docker stopped:**
```bash
docker ps
# Should show: CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
# (empty list)
```

---

### **Step 4: Verify Everything is Stopped**

```bash
# Check all relevant ports
lsof -i :5173 -i :8080 -i :8081 -i :9092 2>/dev/null || echo "All services stopped ✓"

# Check Docker containers
docker ps

# Check specific processes
ps aux | grep -E "spring-boot|vite|trino" | grep -v grep
```

**Expected:** All commands should return empty or "stopped" messages.

---

### **Step 5: Clean Shutdown (Remove Volumes)**

**⚠️ WARNING:** This will delete all database data!

```bash
cd /Users/lizhengyuan/Viz-TrinoFed

# Stop and remove containers + volumes
docker-compose down -v

# Or manually remove volumes
docker volume ls | grep viz-trinofed
docker volume rm viz-trinofed_postgres-data
docker volume rm viz-trinofed_mongo-data
```

---

## 🚀 Complete Startup Instructions

### **Quick Start (All in One)**

```bash
cd /Users/lizhengyuan/Viz-TrinoFed

# 1. Start Docker services
docker-compose up -d

# 2. Wait for services to be ready
echo "Waiting 30 seconds for services to start..."
sleep 30

# 3. Start backend (in new terminal)
# Open new terminal, then:
cd /Users/lizhengyuan/Viz-TrinoFed/backend
JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn spring-boot:run

# 4. Start frontend (in another new terminal)
# Open another terminal, then:
cd /Users/lizhengyuan/Viz-TrinoFed
npm run dev

# 5. Open browser
open http://localhost:5173
```

---

### **Detailed Startup (Step-by-Step)**

#### **Step 1: Start Docker Services**

```bash
cd /Users/lizhengyuan/Viz-TrinoFed
docker-compose up -d
```

**Verify:**
```bash
docker-compose ps
# Should show all 5 containers as "Up"
```

**Wait for Trino to be ready:**
```bash
# Wait 30-60 seconds, then check:
curl http://localhost:8081/v1/info/state
# Should return: "ACTIVE"
```

---

#### **Step 2: Start Backend**

**Open a NEW terminal window:**

```bash
cd /Users/lizhengyuan/Viz-TrinoFed/backend
JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn spring-boot:run
```

**What to look for:**
```
INFO ... Started TrinoKafkaParserApplication in X.XXX seconds
INFO ... Tomcat started on port(s): 8080 (http)
```

**Verify backend is running:**
```bash
# In another terminal:
curl http://localhost:8080/api/queries
# Should return: [] or list of queries
```

**Keep this terminal open!**

---

#### **Step 3: Start Frontend**

**Open ANOTHER NEW terminal window:**

```bash
cd /Users/lizhengyuan/Viz-TrinoFed
npm run dev
```

**What to look for:**
```
VITE v7.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Verify frontend is running:**
```bash
# In another terminal:
curl http://localhost:5173
# Should return: HTML content
```

**Keep this terminal open!**

---

#### **Step 4: Access the Application**

**Open your browser:**
```bash
open http://localhost:5173
```

Or manually navigate to: `http://localhost:5173`

---

#### **Step 5: Test with Trino Queries**

**Open ANOTHER terminal for Trino:**

```bash
docker exec -it trino trino
```

**Run test queries:**
```sql
-- Show available catalogs
SHOW CATALOGS;

-- Query PostgreSQL
SELECT * FROM postgres.public.customers LIMIT 5;

-- Query MongoDB (if configured)
SELECT * FROM mongodb.mydb.products LIMIT 5;

-- Federated query
SELECT c.customer_id, c.name, o.order_id
FROM postgres.public.customers c
JOIN postgres.public.orders o ON c.customer_id = o.customer_id
LIMIT 5;

-- Exit
quit;
```

**Watch the visualization update** in your browser (auto-refreshes every 2 seconds).

---

## 📊 Quick Reference

### **Service Ports**

| Service    | Port | URL                          |
|------------|------|------------------------------|
| Frontend   | 5173 | http://localhost:5173        |
| Backend    | 8080 | http://localhost:8080        |
| Trino      | 8081 | http://localhost:8081        |
| PostgreSQL | 5433 | localhost:5433               |
| MongoDB    | 27018| localhost:27018              |
| Kafka      | 9092 | localhost:9092               |

### **Process Check Commands**

```bash
# Check frontend
lsof -i :5173

# Check backend
lsof -i :8080

# Check Trino
curl http://localhost:8081/v1/info/state

# Check Docker containers
docker ps

# Check all services
lsof -i :5173 -i :8080 -i :8081 -i :9092
```

### **Terminal Layout**

For best experience, have 4 terminals open:

```
┌─────────────────┬─────────────────┐
│   Terminal 1    │   Terminal 2    │
│   Backend       │   Frontend      │
│   (port 8080)   │   (port 5173)   │
├─────────────────┼─────────────────┤
│   Terminal 3    │   Terminal 4    │
│   Trino CLI     │   Commands      │
│   (queries)     │   (docker, etc) │
└─────────────────┴─────────────────┘
```

---

## 🔧 Troubleshooting

### **Issue: Port already in use**

```bash
# Find what's using the port
lsof -i :8080
lsof -i :5173

# Kill the process
kill <PID>

# Force kill if necessary
kill -9 <PID>
```

### **Issue: Docker won't stop**

```bash
# Force stop all containers
docker stop $(docker ps -aq)

# Force remove all containers
docker rm $(docker ps -aq)

# Restart Docker Desktop
# macOS: Click Docker icon → Restart
```

### **Issue: Services won't start**

```bash
# Clean everything and start fresh
docker-compose down -v
docker system prune -f

# Restart Docker Desktop
# Then try starting again
docker-compose up -d
```

### **Issue: Backend won't compile**

```bash
# Clean build
cd /Users/lizhengyuan/Viz-TrinoFed/backend
JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn clean install -DskipTests

# Check Java version
java -version
# Should NOT be Java 23-valhalla
# Should be Java 22 or 17
```

### **Issue: Frontend shows errors**

```bash
# Reinstall dependencies
cd /Users/lizhengyuan/Viz-TrinoFed
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
npm install
```

---

## 📝 Startup Checklist

Before starting, ensure:

- [ ] Docker Desktop is installed and running
- [ ] Java 22 is installed (`/usr/libexec/java_home -v 22`)
- [ ] Node.js and npm are installed
- [ ] No processes using ports 5173, 8080, 8081, 9092
- [ ] Project directory exists: `/Users/lizhengyuan/Viz-TrinoFed`
- [ ] npm dependencies installed (`node_modules` directory exists)

---

## 🔄 Restart Instructions

**Full restart (clean state):**
```bash
# 1. Stop everything
cd /Users/lizhengyuan/Viz-TrinoFed
docker-compose down
# Kill backend and frontend (if running)

# 2. Wait 5 seconds
sleep 5

# 3. Start everything
docker-compose up -d
sleep 30

# 4. Start backend in new terminal
cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn spring-boot:run

# 5. Start frontend in new terminal
npm run dev
```

**Restart just Docker services:**
```bash
cd /Users/lizhengyuan/Viz-TrinoFed
docker-compose restart
```

**Restart just backend:**
- Press `Ctrl+C` in backend terminal
- Run: `JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn spring-boot:run`

**Restart just frontend:**
- Press `Ctrl+C` in frontend terminal
- Run: `npm run dev`

---

## 🎯 Common Workflows

### **Daily Development Start**

```bash
# Terminal 1: Docker (if not running)
cd /Users/lizhengyuan/Viz-TrinoFed
docker-compose up -d

# Terminal 2: Backend
cd /Users/lizhengyuan/Viz-TrinoFed/backend
JAVA_HOME=$(/usr/libexec/java_home -v 22) mvn spring-boot:run

# Terminal 3: Frontend
cd /Users/lizhengyuan/Viz-TrinoFed
npm run dev

# Terminal 4: Open browser
open http://localhost:5173
```

### **Daily Development End**

```bash
# Terminal 2 (Backend): Ctrl+C
# Terminal 3 (Frontend): Ctrl+C

# Terminal 1: Stop Docker (optional)
cd /Users/lizhengyuan/Viz-TrinoFed
docker-compose down
```

### **Testing Changes**

```bash
# Backend changes:
# 1. Press Ctrl+C in backend terminal
# 2. Code changes are saved
# 3. Restart: mvn spring-boot:run

# Frontend changes:
# - Vite auto-reloads, no restart needed
# - Just save your files

# Docker/Trino config changes:
docker-compose down
docker-compose up -d
```

---

## ✅ Status: Everything Stopped

**Current State (as of this guide creation):**
- ✅ Frontend stopped (port 5173 free)
- ✅ Backend stopped (port 8080 free)
- ✅ All Docker containers stopped
- ✅ All networks removed
- ✅ System ready for fresh start

**To verify:**
```bash
docker ps  # Should be empty
lsof -i :5173 -i :8080 -i :8081 -i :9092  # Should show nothing
```

---

## 📚 Related Documentation

- `illustration.md` - Complete startup and testing guide
- `JSON_PLAN_PARSING_GUIDE.md` - JSON plan parsing implementation
- `demo-json-plan-parsing.sh` - Automated demonstration script
- `README.md` - Project overview

---

**Last Updated:** October 26, 2025
**Status:** All services successfully stopped
**Ready for:** Fresh startup
