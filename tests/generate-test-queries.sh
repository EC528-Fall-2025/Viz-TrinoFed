#!/bin/bash

echo "📊 Generating Test Queries for Graph Visualization..."
echo "This script will run multiple queries over time to populate the graphs."
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a query and wait
run_query() {
    local query_num=$1
    local description=$2
    local query=$3
    local delay=$4
    
    echo -e "${BLUE}Query ${query_num}: ${description}${NC}"
    echo "SQL: ${query}"
    docker exec trino trino --execute "$query" 2>&1 | grep -v "WARNING\|Unable to create"
    echo ""
    
    if [ -n "$delay" ]; then
        echo -e "${YELLOW}Waiting ${delay} seconds before next query...${NC}"
        sleep $delay
        echo ""
    fi
}

# Query 1: Simple SELECT (fast, low CPU)
run_query 1 "Simple SELECT - Baseline" \
    "SELECT 1 as test_value, current_timestamp as ts" \
    5

# Query 2: PostgreSQL simple query
run_query 2 "PostgreSQL - Count customers" \
    "SELECT COUNT(*) as customer_count FROM postgres.public.customers" \
    5

# Query 3: PostgreSQL with WHERE
run_query 3 "PostgreSQL - Filter customers" \
    "SELECT name, email, country FROM postgres.public.customers WHERE country = 'USA'" \
    5

# Query 4: MongoDB simple query
run_query 4 "MongoDB - List products" \
    "SELECT name, brand, price FROM mongodb.sample_db.products LIMIT 5" \
    5

# Query 5: PostgreSQL JOIN (more complex)
run_query 5 "PostgreSQL - Customer orders JOIN" \
    "SELECT c.name, c.country, o.product_name, o.quantity, o.price 
     FROM postgres.public.customers c 
     JOIN postgres.public.orders o ON c.id = o.customer_id 
     LIMIT 10" \
    5

# Query 6: Aggregation query (moderate CPU)
run_query 6 "PostgreSQL - Aggregation" \
    "SELECT country, COUNT(*) as customer_count 
     FROM postgres.public.customers 
     GROUP BY country 
     ORDER BY customer_count DESC" \
    5

# Query 7: MongoDB aggregation
run_query 7 "MongoDB - Product aggregation" \
    "SELECT brand, AVG(CAST(price AS DOUBLE)) as avg_price, COUNT(*) as product_count 
     FROM mongodb.sample_db.products 
     GROUP BY brand" \
    5

# Query 8: Federated query (PostgreSQL + MongoDB) - More complex
run_query 8 "Federated Query - Cross-database JOIN" \
    "SELECT c.name as customer_name, o.product_name, p.brand, p.price 
     FROM postgres.public.customers c 
     JOIN postgres.public.orders o ON c.id = o.customer_id 
     LEFT JOIN mongodb.sample_db.products p ON LOWER(o.product_name) = LOWER(p.name) 
     LIMIT 10" \
    5

# Query 9: Complex aggregation with multiple tables
run_query 9 "Complex Aggregation - Customer spending" \
    "SELECT 
        c.name, 
        c.country, 
        COUNT(o.id) as order_count, 
        SUM(o.price * o.quantity) as total_spent 
     FROM postgres.public.customers c 
     LEFT JOIN postgres.public.orders o ON c.id = o.customer_id 
     GROUP BY c.name, c.country 
     ORDER BY total_spent DESC NULLS LAST" \
    5

# Query 10: MongoDB with WHERE and sorting
run_query 10 "MongoDB - Filtered and sorted" \
    "SELECT name, brand, price 
     FROM mongodb.sample_db.products 
     WHERE instock = true 
     ORDER BY CAST(price AS DOUBLE) DESC" \
    5

# Query 11: Multiple aggregations
run_query 11 "Multiple Aggregations - Statistics" \
    "SELECT 
        COUNT(DISTINCT c.id) as unique_customers,
        COUNT(o.id) as total_orders,
        SUM(o.price * o.quantity) as total_revenue,
        AVG(o.price * o.quantity) as avg_order_value
     FROM postgres.public.customers c 
     LEFT JOIN postgres.public.orders o ON c.id = o.customer_id" \
    5

# Query 12: Cross-database with subquery
run_query 12 "Federated with Subquery" \
    "SELECT 
        p.name as product_name,
        p.brand,
        p.price,
        (SELECT COUNT(*) FROM postgres.public.orders o WHERE LOWER(o.product_name) = LOWER(p.name)) as order_count
     FROM mongodb.sample_db.products p 
     WHERE p.instock = true" \
    5

# Query 13: Window function (more CPU intensive)
run_query 13 "Window Function - Customer ranking" \
    "SELECT 
        name,
        country,
        COUNT(*) OVER (PARTITION BY country) as customers_in_country,
        ROW_NUMBER() OVER (PARTITION BY country ORDER BY name) as country_rank
     FROM postgres.public.customers" \
    5

# Query 14: Multiple JOINs
run_query 14 "Multiple JOINs - Full details" \
    "SELECT 
        c.name,
        c.email,
        c.country,
        o.product_name,
        o.quantity,
        o.price,
        o.order_date
     FROM postgres.public.customers c 
     JOIN postgres.public.orders o ON c.id = o.customer_id 
     ORDER BY o.order_date DESC 
     LIMIT 15" \
    5

# Query 15: Final complex query
run_query 15 "Final Complex Query - Full analysis" \
    "SELECT 
        c.country,
        COUNT(DISTINCT c.id) as customer_count,
        COUNT(o.id) as order_count,
        SUM(o.price * o.quantity) as total_revenue,
        AVG(o.price * o.quantity) as avg_order_value,
        MAX(o.order_date) as latest_order
     FROM postgres.public.customers c 
     LEFT JOIN postgres.public.orders o ON c.id = o.customer_id 
     GROUP BY c.country 
     ORDER BY total_revenue DESC NULLS LAST" \
    3

echo ""
echo -e "${GREEN}✅ All test queries completed!${NC}"
echo ""
echo "Waiting 5 seconds for final events to be processed..."
sleep 5

echo ""
echo "📈 Checking results..."
QUERY_COUNT=$(curl -s http://localhost:8080/api/queries | jq 'length')
echo -e "${GREEN}Total queries captured: ${QUERY_COUNT}${NC}"

echo ""
echo "Query IDs:"
curl -s http://localhost:8080/api/queries/ids | jq '.'

echo ""
echo -e "${GREEN}🎉 Test query generation complete!${NC}"
echo "Check the Overall Stats page to see the graphs with time-series data."
echo ""

