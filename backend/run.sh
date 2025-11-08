#!/bin/bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# Load environment variables from .env file if it exists
if [ -f "../.env" ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' ../.env | xargs)
else
    echo "Warning: .env file not found in project root. Using system environment variables."
    echo "To configure AWS Bedrock and database settings, copy env.template to .env:"
    echo "  cp ../env.template ../.env"
fi

# Run the Spring Boot application
mvn spring-boot:run
