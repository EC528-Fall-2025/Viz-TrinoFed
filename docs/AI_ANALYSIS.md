** **

## 8. AI-Powered Query Optimization Setup

This project includes an optional AI-powered query optimization feature using Amazon Bedrock. This feature analyzes your Trino queries and provides:
- Optimized query rewrites to reduce latency
- Bottleneck analysis based on execution statistics
- Actionable optimization suggestions
- Expected performance improvements

### Prerequisites

1. **AWS Account** with access to Amazon Bedrock
2. **IAM Permissions** - Your AWS user/role needs the following permission:
   ```json
   {
     "Effect": "Allow",
     "Action": [
       "bedrock:InvokeModel"
     ],
     "Resource": "arn:aws:bedrock:*::foundation-model/*"
   }
   ```
3. **Bedrock Model Access** - Request access to Claude models in the AWS Bedrock console (typically available in us-east-1, us-west-2, eu-west-1)

### Configuration

#### Backend Configuration (application.yml)

The backend is configured via environment variables that map to `backend/src/main/resources/application.yml`:

```yaml
aws:
  bedrock:
    enabled: ${AWS_BEDROCK_ENABLED:false}
    region: ${AWS_REGION:us-east-1}
    model-id: ${AWS_BEDROCK_MODEL_ID:anthropic.claude-3-5-sonnet-20241022-v2:0}
    access-key-id: ${AWS_ACCESS_KEY_ID:}
    secret-access-key: ${AWS_SECRET_ACCESS_KEY:}
```

#### Environment Variables

Set the following environment variables before starting the backend:

```bash
# Enable the AI feature
export AWS_BEDROCK_ENABLED=true

# AWS Region (where Bedrock is available)
export AWS_REGION=us-east-1

# (Optional) Specify a different model
# Default: Claude 3.5 Sonnet (recommended for query optimization)
# Alternatives:
#   - anthropic.claude-3-sonnet-20240229-v1:0 (Claude 3 Sonnet)
#   - anthropic.claude-3-haiku-20240307-v1:0 (Claude 3 Haiku - faster, cheaper)
export AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# AWS Credentials - Choose ONE of the following options:

# Option 1: Explicit credentials (NOT recommended for production)
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Option 2: Use IAM roles (RECOMMENDED)
# For EC2/ECS/Lambda: Attach an IAM role with bedrock:InvokeModel permission
# For local development: Use AWS CLI configuration (~/.aws/credentials)
# Leave AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY unset
```

#### Docker Compose Configuration

If using Docker Compose, add the environment variables to your backend service:

```yaml
services:
  backend:
    environment:
      - AWS_BEDROCK_ENABLED=true
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
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

**Cost Considerations:**
- The feature only runs when you click the analyze button (not automatic)
- Claude 3.5 Sonnet costs approximately $0.003 per 1K input tokens and $0.015 per 1K output tokens
- A typical analysis uses 500-2000 input tokens and generates 500-1500 output tokens
- Estimated cost per analysis: $0.01 - $0.05

### Security Notes

- **Backend Only**: All AI API calls are made from the backend - AWS credentials are never exposed to the frontend
- **No Query Results**: Only query text, execution statistics, and query plans are sent to the AI - never actual query results or sensitive data
- **Configurable**: The feature is disabled by default and requires explicit configuration
- **Production Best Practices**: Use IAM roles instead of access keys when deploying to AWS infrastructure

