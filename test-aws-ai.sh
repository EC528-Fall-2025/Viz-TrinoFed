#!/bin/bash

# AWS Bedrock AI Integration Test Script
# Run this after adding your AWS Access Keys to .env

echo "═══════════════════════════════════════════════════"
echo "AWS Bedrock AI Integration Test"
echo "═══════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:8080/api/queries/ids > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo ""
    echo "Start the backend first:"
    echo "  cd /Users/lizhengyuan/Viz-TrinoFed/backend"
    echo "  ./run.sh"
    exit 1
fi

echo ""
echo "2. Checking AI feature status..."
AI_STATUS=$(curl -s http://localhost:8080/api/ai/status)
echo "Response: $AI_STATUS"

# Parse the available field
AVAILABLE=$(echo $AI_STATUS | grep -o '"available":[^,}]*' | grep -o '[^:]*$')

if [ "$AVAILABLE" = "true" ]; then
    echo -e "${GREEN}✓ AI feature is available and configured${NC}"
else
    echo -e "${RED}✗ AI feature is not available${NC}"
    echo ""
    echo "Possible issues:"
    echo "  1. AWS_BEDROCK_ENABLED is not set to 'true' in .env"
    echo "  2. AWS_ACCESS_KEY_ID is not configured in .env"
    echo "  3. AWS_SECRET_ACCESS_KEY is not configured in .env"
    echo ""
    echo "Check your .env file:"
    echo "  cat /Users/lizhengyuan/Viz-TrinoFed/.env | grep AWS"
    exit 1
fi

echo ""
echo "3. Checking backend logs for AWS connection..."
echo ""
echo "Look for these messages in backend logs:"
echo "  - 'Using explicit AWS credentials from configuration'"
echo "  - 'Bedrock AI feature is enabled'"
echo ""

echo "═══════════════════════════════════════════════════"
echo -e "${GREEN}✓ All checks passed!${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Run a query in your Trino system"
echo "  2. In the frontend, you should see 'Analyze with AI' button"
echo "  3. Click it to get AI-powered query optimization suggestions"
echo ""
echo "To test via API directly:"
echo "  curl http://localhost:8080/api/ai/analyze/<query-id>"
echo ""
