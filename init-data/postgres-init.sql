-- Sample data for PostgreSQL
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    city VARCHAR(50),
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample customers
INSERT INTO customers (name, email, city, country) VALUES
('John Doe', 'john.doe@email.com', 'New York', 'USA'),
('Jane Smith', 'jane.smith@email.com', 'London', 'UK'),
('Bob Johnson', 'bob.johnson@email.com', 'Toronto', 'Canada'),
('Alice Brown', 'alice.brown@email.com', 'Sydney', 'Australia'),
('Charlie Wilson', 'charlie.wilson@email.com', 'Berlin', 'Germany')
ON CONFLICT (email) DO NOTHING;

-- Insert sample orders
INSERT INTO orders (customer_id, product_name, quantity, price) VALUES
(1, 'Laptop', 1, 999.99),
(1, 'Mouse', 2, 25.50),
(2, 'Keyboard', 1, 75.00),
(3, 'Monitor', 1, 299.99),
(3, 'Webcam', 1, 89.99),
(4, 'Headphones', 1, 149.99),
(5, 'Tablet', 1, 399.99),
(2, 'Phone Case', 3, 15.99),
(1, 'USB Cable', 5, 12.99),
(4, 'Wireless Charger', 1, 45.99);
