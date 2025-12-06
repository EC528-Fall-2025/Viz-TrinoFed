## AI-Powered Query Optimization Setup

This project includes an optional AI-powered query optimization feature using Amazon Bedrock. This feature analyzes your Trino queries and provides:
- Optimized query rewrites to reduce latency
- Bottleneck analysis based on execution statistics
- Actionable optimization suggestions
- Expected performance improvements

### Prerequisites

1. **AWS Account** with access to Amazon Bedrock
2. **Bedrock Model Access** - Request access to Claude models in the AWS Bedrock console (typically available in us-east-1, us-west-2, eu-west-1)

### Configuration

#### Backend Configuration (application.yml)

The backend is configured via environment variables that map to `backend/src/main/resources/application.yml`:

```yaml
aws:
  bedrock:
    enabled: ${AWS_BEDROCK_ENABLED:false}
    region: ${AWS_REGION:us-east-1}
    model-id: ${AWS_BEDROCK_MODEL_ID:us.anthropic.claude-sonnet-4-5-20250929-v1:0}
    access-key-id: ${AWS_ACCESS_KEY_ID:}
    secret-access-key: ${AWS_SECRET_ACCESS_KEY:}
```

#### Environment Variables

You can either set the following environment variables before starting the backend, or pass them to the `docker-compose.user.yml` listed in the [Docker Install Instructions](/docs/DOCKER_INSTALL.md):

```bash
# Enable the AI feature
export AWS_BEDROCK_ENABLED=true

# AWS Region (where Bedrock is available)
export AWS_REGION=us-east-1

# (Optional) Specify a different model
# Default: Claude 4.5 Sonnet (recommended for query optimization)
export AWS_BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-5-20250929-v1:0

# AWS Credentials
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

### Usage

1. **Start the application** with the environment variables configured
2. **Navigate to a query** in the visualization UI
3. **Scroll to the "AI Query Optimization" section** in the metrics panel
4. **Click "✨ Analyze Query with AI"** to request optimization suggestions
5. **Review the results**:
   - Bottleneck analysis based on your query's execution statistics
   - Optimized SQL query that should perform better
   - Specific suggestions for improvement
   - Expected performance gains

### Troubleshooting

**"AI Feature Not Configured" message:**
- Ensure `AWS_BEDROCK_ENABLED=true` is set
- Verify your AWS credentials are configured correctly
- Check that the backend service can access AWS (network/firewall rules)

**"Failed to analyze query" error:**
- Verify you have access to the specified Bedrock model in your AWS region
- Check IAM permissions include `bedrock:InvokeModel`
- Ensure the AWS region supports Bedrock (try us-east-1)
- Review backend logs for detailed error messages

### Security Notes

- **Backend Only**: All AI API calls are made from the backend - AWS credentials are never exposed to the frontend
- **No Query Results**: Only query text, execution statistics, and query plans are sent to the AI - never actual query results or sensitive data
- **Configurable**: The feature is disabled by default and requires explicit configuration
- **IAM Roles**: This project does not currently support AWS IAM roles
