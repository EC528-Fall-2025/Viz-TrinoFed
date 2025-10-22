# Sample Data Initialization

This folder contains initialization scripts that automatically populate PostgreSQL and MongoDB with sample data when Docker containers start.

## 📁 Files

### `postgres-init.sql`
Creates and populates PostgreSQL tables:
- **`customers`** table: 5 sample customers from different countries
- **`orders`** table: 10 sample orders with products and prices

### `mongo-init.js`
Creates and populates MongoDB collections:
- **`products`** collection: 5 electronics products with specifications
- **`reviews`** collection: 5 product reviews with ratings

## 🔄 How It Works

When you run `docker-compose up`, these scripts are automatically executed:
1. PostgreSQL runs `postgres-init.sql` on first startup
2. MongoDB runs `mongo-init.js` on first startup

**Note:** Scripts only run on first initialization. To re-initialize:
```bash
# Stop and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## 🧪 Sample Queries

Once data is loaded, try these Trino queries:

### PostgreSQL Queries via Trino:
```sql
-- View all customers
SELECT * FROM postgres.public.customers;

-- Orders by customer
SELECT
    c.name,
    c.email,
    o.product_name,
    o.quantity,
    o.price
FROM postgres.public.customers c
JOIN postgres.public.orders o ON c.id = o.customer_id;

-- Total spending per customer
SELECT
    c.name,
    SUM(o.price * o.quantity) as total_spent
FROM postgres.public.customers c
JOIN postgres.public.orders o ON c.id = o.customer_id
GROUP BY c.name
ORDER BY total_spent DESC;
```

### MongoDB Queries via Trino:
```sql
-- View all products
SELECT * FROM mongodb.sample_db.products;

-- Products in stock
SELECT name, brand, price
FROM mongodb.sample_db.products
WHERE instock = true;

-- Average rating per product
SELECT
    productname,
    AVG(rating) as avg_rating,
    COUNT(*) as review_count
FROM mongodb.sample_db.reviews
GROUP BY productname
ORDER BY avg_rating DESC;
```

### Federated Query (PostgreSQL + MongoDB):
```sql
-- Join customer orders with product details
SELECT
    c.name as customer_name,
    o.product_name,
    o.quantity,
    p.brand,
    p.price as current_price
FROM postgres.public.customers c
JOIN postgres.public.orders o ON c.id = o.customer_id
LEFT JOIN mongodb.sample_db.products p ON LOWER(o.product_name) = LOWER(p.name);
```

## 📊 Data Overview

### PostgreSQL Tables:
| Table | Rows | Columns |
|-------|------|---------|
| customers | 5 | id, name, email, city, country, created_at |
| orders | 10 | id, customer_id, product_name, quantity, price, order_date |

### MongoDB Collections:
| Collection | Documents | Fields |
|------------|-----------|--------|
| products | 5 | name, category, brand, specifications, price, inStock, tags |
| reviews | 5 | productName, customerEmail, rating, comment, reviewDate, helpful |
