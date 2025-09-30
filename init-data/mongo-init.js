// MongoDB initialization script
// This script will be executed when MongoDB container starts

// Switch to the sample database
db = db.getSiblingDB('sample_db');

// Create products collection
db.products.insertMany([
    {
        _id: ObjectId(),
        name: "Laptop",
        category: "Electronics",
        brand: "TechCorp",
        specifications: {
            cpu: "Intel i7",
            ram: "16GB",
            storage: "512GB SSD"
        },
        price: 999.99,
        inStock: true,
        tags: ["computer", "portable", "work"],
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Mouse",
        category: "Electronics",
        brand: "TechCorp",
        specifications: {
            type: "Wireless",
            dpi: "1600",
            buttons: 3
        },
        price: 25.50,
        inStock: true,
        tags: ["computer", "peripheral"],
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Keyboard",
        category: "Electronics",
        brand: "KeyMaster",
        specifications: {
            type: "Mechanical",
            layout: "QWERTY",
            backlight: true
        },
        price: 75.00,
        inStock: true,
        tags: ["computer", "peripheral", "gaming"],
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Monitor",
        category: "Electronics",
        brand: "ViewTech",
        specifications: {
            size: "27 inch",
            resolution: "4K",
            refreshRate: "60Hz"
        },
        price: 299.99,
        inStock: true,
        tags: ["display", "computer"],
        createdAt: new Date()
    },
    {
        _id: ObjectId(),
        name: "Webcam",
        category: "Electronics",
        brand: "CamTech",
        specifications: {
            resolution: "1080p",
            fps: "30",
            microphone: true
        },
        price: 89.99,
        inStock: false,
        tags: ["camera", "streaming"],
        createdAt: new Date()
    }
]);

// Create reviews collection
db.reviews.insertMany([
    {
        _id: ObjectId(),
        productName: "Laptop",
        customerEmail: "john.doe@email.com",
        rating: 5,
        comment: "Excellent laptop, very fast and reliable!",
        reviewDate: new Date(),
        helpful: 15
    },
    {
        _id: ObjectId(),
        productName: "Mouse",
        customerEmail: "jane.smith@email.com",
        rating: 4,
        comment: "Good mouse, comfortable to use.",
        reviewDate: new Date(),
        helpful: 8
    },
    {
        _id: ObjectId(),
        productName: "Keyboard",
        customerEmail: "bob.johnson@email.com",
        rating: 5,
        comment: "Amazing mechanical keyboard, great for gaming!",
        reviewDate: new Date(),
        helpful: 12
    },
    {
        _id: ObjectId(),
        productName: "Monitor",
        customerEmail: "alice.brown@email.com",
        rating: 4,
        comment: "Beautiful 4K display, colors are vibrant.",
        reviewDate: new Date(),
        helpful: 6
    },
    {
        _id: ObjectId(),
        productName: "Laptop",
        customerEmail: "charlie.wilson@email.com",
        rating: 5,
        comment: "Perfect for work and development. Highly recommended!",
        reviewDate: new Date(),
        helpful: 20
    }
]);

print("MongoDB sample data initialized successfully!");
