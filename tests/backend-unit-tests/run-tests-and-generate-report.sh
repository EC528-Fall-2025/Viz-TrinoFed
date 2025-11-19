#!/bin/bash

# Backend Unit Testing - Run Tests and Generate Report
# This script runs all unit tests and generates coverage reports

echo "========================================"
echo "Backend Unit Testing for Viz-TrinoFed"
echo "========================================"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/../backend" || exit 1

echo "Step 1: Cleaning previous builds..."
mvn clean

echo ""
echo "Step 2: Running unit tests..."
mvn test

TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo "✓ All tests passed successfully!"
else
    echo "✗ Some tests failed. Check output above."
    exit 1
fi

echo ""
echo "Step 3: Generating coverage report..."
mvn jacoco:report

echo ""
echo "========================================"
echo "Test Execution Complete!"
echo "========================================"
echo ""
echo "Coverage report generated at:"
echo "  backend/target/site/jacoco/index.html"
echo ""
echo "To view the report, run:"
echo "  open backend/target/site/jacoco/index.html"
echo ""
