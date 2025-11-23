# Quick Start Guide

This guide will help you get the Viz-TrinoFed application up and running quickly.

## Prerequisites

- Docker and Docker Compose
- Java 17 or higher
- Maven 3.6+
- Node.js 16+ and npm

## Step 1: Start Docker Services

First, start all the required services (Trino, PostgreSQL, MongoDB, Kafka, Zookeeper):

```bash
cd /Users/lizhengyuan/Viz-TrinoFed
docker-compose up -d
```

Wait for all services to be healthy (this may take 1-2 minutes). You can check the status with:

```bash
docker-compose ps
```

## Step 2: Start the Backend

The backend requires JDK 17-21. If you don't have JDK 21 installed, install it first:

```bash
brew install openjdk@21
```

Open a new terminal and start the Java Spring Boot backend with JDK 21:

```bash
cd /Users/lizhengyuan/Viz-TrinoFed/backend
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home mvn spring-boot:run
```

The backend will start on **http://localhost:8080**

**Note:** If you encounter a Java version error, make sure you're using JDK 17-21. The backend is not compatible with JDK 22+.

## Step 3: Start the Frontend

Open another terminal and start the React frontend:

```bash
cd /Users/lizhengyuan/Viz-TrinoFed
npm run dev
```

The frontend will start on **http://localhost:5173** (or the next available port if 5173 is in use)

## Step 4: Run Example Queries

Once all services are running, you can execute queries through the Trino CLI.

### Quick Start - Run Queries Directly

Use these one-line commands to execute queries directly (easiest method):

```bash
# Query 1: Simple aggregation - Count customers by city in USA/Canada
docker exec trino trino --execute "SELECT city, COUNT(*) as customer_count FROM postgres.public.customers WHERE country IN ('USA', 'Canada') GROUP BY city ORDER BY customer_count DESC;"

# Query 2: Get all customers and their orders (PostgreSQL only)
docker exec trino trino --execute "SELECT c.name, c.email, c.city, o.product_name, o.quantity, o.price FROM postgres.public.customers c JOIN postgres.public.orders o ON c.id = o.customer_id ORDER BY c.name;"

# Query 3: Get affordable products from MongoDB
docker exec trino trino --execute "SELECT name, category, brand, price, inStock FROM mongodb.sample_db.products WHERE price < 100;"

# Query 4: Federated join - Orders with Product details
docker exec trino trino --execute "SELECT o.product_name, o.quantity, o.price as order_price, p.brand, p.category, p.inStock FROM postgres.public.orders o LEFT JOIN mongodb.sample_db.products p ON LOWER(o.product_name) = LOWER(p.name) ORDER BY o.order_date DESC;"

# Query 5: Federated join - Product reviews with customer info
docker exec trino trino --execute "SELECT r.productName, c.name as customer_name, c.city, c.country, r.rating, r.comment FROM mongodb.sample_db.reviews r JOIN postgres.public.customers c ON r.customerEmail = c.email ORDER BY r.rating DESC;"
```

### Access Trino Web UI (Alternative)

You can also use the Trino Web UI:
```
http://localhost:8081
```

### Interactive CLI (Alternative)

For interactive queries:

```bash
docker exec -it trino trino
```

Then paste queries interactively.

## Step 5: View Query Visualization

1. Open the frontend at **http://localhost:5173** (or check the port from the terminal output)
2. Execute one of the example queries from Step 4
3. The query execution will be captured by Kafka and processed by the backend
4. View the interactive query tree visualization in the web UI

**Note:** The visualization appears automatically after running a query. Refresh the page if needed.

## Service Ports Summary

| Service    | Port  | URL                      |
|------------|-------|--------------------------|
| Frontend   | 5173* | http://localhost:5173    |
| Backend    | 8080  | http://localhost:8080    |
| Trino UI   | 8081  | http://localhost:8081    |
| PostgreSQL | 5433  | localhost:5433           |
| MongoDB    | 27018 | localhost:27018          |
| Kafka      | 9092  | localhost:9092           |

\* Frontend will use the next available port if 5173 is in use (e.g., 5174)

## Stopping Services

To stop all services:

```bash
# Stop frontend (Ctrl+C in the terminal)
# Stop backend (Ctrl+C in the terminal)

# Stop Docker services
docker-compose down
```

To stop and remove all data:

```bash
docker-compose down -v
```

## Troubleshooting

### Port Already in Use

If you get port conflicts, you can modify the ports in:
- `docker-compose.yml` for Docker services
- `backend/src/main/resources/application.yml` for backend
- Frontend uses Vite default (5173)

### Services Not Ready

If queries fail, wait a bit longer for all services to initialize, especially Kafka and Trino.

### Check Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs trino
docker-compose logs kafka
docker-compose logs postgresql
docker-compose logs mongodb
```

## Next Steps

- Explore the interactive query tree visualization
- Try more complex federated queries
- Check out the AI-powered query optimization features (configure AWS Bedrock in `.env`)
- Review the full README.md for detailed project information
