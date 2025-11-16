#!/bin/bash
set -e  # Exit on any error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project root to ensure all paths work correctly
cd "$PROJECT_ROOT"

echo "Running frontend tests and getting coverage stats...";
npm run test:coverage

echo "Running lint tests...";
npm run lint

echo "Checking if backend is running...";
if ! curl -f http://localhost:8080/api/queries > /dev/null 2>&1; then
    echo "Failed: Backend is not running. Please start the backend first.";
    exit 1;
fi

echo "Running test query...";
"$SCRIPT_DIR/test-query.sh"

echo "Running backend tests...";
cd "$PROJECT_ROOT/backend"
# Set JAVA_HOME to Java 21 (required by Maven enforcer)
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
mvn test

echo "All tests completed successfully!";
exit 0;
