# AWS Bedrock AI Setup Guide for Viz-TrinoFed

## 🎯 What This Feature Does

The AWS Bedrock AI integration provides:
- **Query Optimization Suggestions** - AI analyzes your Trino queries and suggests improvements
- **Bottleneck Analysis** - Identifies performance issues in query execution
- **Optimized Query Generation** - Claude AI rewrites queries for better performance
- **Performance Predictions** - Estimates expected improvement

## 📋 Prerequisites

1. AWS Account with access to Bedrock
2. IAM user with Bedrock permissions
3. AWS Access Key ID and Secret Access Key
4. Claude model enabled in your AWS region

---

## 🔑 Step 1: Get AWS Access Keys

You have AWS console credentials (username: Zhengyuan_Li), but the application needs **Access Keys** for programmatic access.

### Option A: Create Access Keys in AWS Console

1. **Login to AWS Console**
   - Go to: https://console.aws.amazon.com/
   - Username: `Zhengyuan_Li`
   - Password: `<your password>`

2. **Navigate to IAM**
   - Search for "IAM" in the top search bar
   - Click on "IAM" service

3. **Go to Your User**
   - Click "Users" in the left sidebar
   - Click on your username: `Zhengyuan_Li`

4. **Create Access Key**
   - Click "Security credentials" tab
   - Scroll down to "Access keys" section
   - Click "Create access key"
   - Choose use case: "Command Line Interface (CLI)" or "Application running outside AWS"
   - Click "Next"
   - Add description tag (optional): "Viz-TrinoFed Project"
   - Click "Create access key"

5. **IMPORTANT: Save Your Keys**
   ```
   Access Key ID:     AKIA... (starts with AKIA)
   Secret Access Key: wJalrXUtnFEMI/K7MDENG... (long random string)
   ```

   ⚠️ **WARNING:** You can only see the Secret Access Key ONCE. Download the CSV file!

### Option B: Use AWS CLI (if you have access)

```bash
# If you already have AWS CLI configured
aws iam create-access-key --user-name Zhengyuan_Li
```

---

## 🔧 Step 2: Configure Environment Variables

### Update Your `.env` File

1. **Open the .env file**
   ```bash
   cd /Users/lizhengyuan/Viz-TrinoFed
   nano .env
   # OR
   code .env
   ```

2. **Add AWS Configuration**
   ```env
   # Enable or disable the AI feature
   AWS_BEDROCK_ENABLED=true

   # AWS Region where Bedrock is available
   AWS_REGION=us-east-1

   # Bedrock Model ID (Claude Sonnet 4)
   AWS_BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0

   # AWS Credentials
   AWS_ACCESS_KEY_ID=AKIA...your_access_key_here
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI...your_secret_key_here
   ```

3. **Save and close the file**

### Alternative: Use AWS Credentials File

Instead of putting keys in `.env`, you can use AWS credentials file:

```bash
# Create/edit AWS credentials file
mkdir -p ~/.aws
nano ~/.aws/credentials
```

Add:
```ini
[default]
aws_access_key_id = AKIA...your_access_key_here
aws_secret_access_key = wJalrXUtnFEMI...your_secret_key_here
region = us-east-1
```

If using this method, you can leave `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` empty in `.env`.

---

## 🌍 Step 3: Verify AWS Bedrock Access

### Check Region Availability

Claude models in Bedrock are available in specific regions:
- **us-east-1** (N. Virginia) ✅ Recommended
- **us-west-2** (Oregon)
- **eu-west-1** (Ireland)
- **ap-southeast-1** (Singapore)

### Enable Claude Model

1. Go to AWS Console → Bedrock
2. Navigate to "Model access" in the left sidebar
3. Click "Manage model access"
4. Enable: **Anthropic Claude Sonnet 4**
5. Click "Save changes"
6. Wait 2-5 minutes for activation

### Verify IAM Permissions

Your IAM user (`Zhengyuan_Li`) needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
    }
  ]
}
```

**To check permissions:**
1. AWS Console → IAM → Users → Zhengyuan_Li
2. Click "Permissions" tab
3. Look for "BedrockFullAccess" or similar policy

---

## 🚀 Step 4: Test the Configuration

### Test 1: Backend Configuration

1. **Update backend application.yml**

   File: `backend/src/main/resources/application.yml`

   Ensure it has:
   ```yaml
   aws:
     bedrock:
       enabled: ${AWS_BEDROCK_ENABLED:false}
       region: ${AWS_REGION:us-east-1}
       model-id: ${AWS_BEDROCK_MODEL_ID:us.anthropic.claude-sonnet-4-20250514-v1:0}
       access-key-id: ${AWS_ACCESS_KEY_ID:}
       secret-access-key: ${AWS_SECRET_ACCESS_KEY:}
   ```

2. **Restart the backend**
   ```bash
   cd /Users/lizhengyuan/Viz-TrinoFed/backend
   ./run.sh
   ```

3. **Check logs for AWS connection**
   Look for:
   ```
   Using explicit AWS credentials from configuration
   Bedrock AI feature is enabled
   ```

### Test 2: Test API Endpoint

```bash
# Test if AI is available
curl http://localhost:8080/api/ai/available

# Expected response:
# {"available": true}
```

### Test 3: Full AI Analysis

```bash
curl -X POST http://localhost:8080/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "queryId": "test-123",
    "query": "SELECT * FROM users WHERE age > 25",
    "state": "FINISHED",
    "executionTimeMs": 1500,
    "cpuTimeMs": 800,
    "totalRows": 10000,
    "catalogs": ["postgres"],
    "schemas": ["public"]
  }'
```

Expected response:
```json
{
  "queryId": "test-123",
  "originalQuery": "SELECT * FROM users WHERE age > 25",
  "optimizedQuery": "SELECT * FROM users WHERE age > 25 AND ...",
  "bottleneckAnalysis": "The query performs a full table scan...",
  "suggestions": [
    "Add an index on the age column",
    "Consider partitioning the users table"
  ],
  "expectedImprovement": "30-40% faster execution with proper indexing",
  "available": true
}
```

---

## 🎨 Step 5: Use in Frontend

### Enable AI Button in UI

The frontend should automatically detect if AI is available:

1. **Check AI availability**
   - Frontend calls: `GET /api/ai/available`
   - If `available: true`, shows "Analyze with AI" button

2. **Request AI Analysis**
   - User clicks "Analyze with AI" button
   - Frontend sends query data to: `POST /api/ai/analyze`
   - Displays AI suggestions in a modal/panel

3. **View Results**
   - Shows optimized query
   - Lists bottleneck analysis
   - Displays improvement suggestions

---

## 🔍 Troubleshooting

### Error: "Bedrock AI feature is not enabled"

**Solution:**
```bash
# Check .env file
cat .env | grep AWS_BEDROCK_ENABLED
# Should show: AWS_BEDROCK_ENABLED=true

# If false, change it:
sed -i '' 's/AWS_BEDROCK_ENABLED=false/AWS_BEDROCK_ENABLED=true/' .env

# Restart backend
cd backend && ./run.sh
```

### Error: "Unable to authenticate"

**Possible causes:**
1. Access keys are incorrect
2. Access keys not configured
3. IAM user doesn't have Bedrock permissions

**Solution:**
```bash
# Test AWS credentials with CLI
aws bedrock list-foundation-models --region us-east-1

# If this works, your credentials are correct
# If not, recreate access keys
```

### Error: "Model not found" or "Access denied"

**Solution:**
1. Go to AWS Console → Bedrock → Model access
2. Enable "Anthropic Claude Sonnet 4"
3. Wait 5 minutes for activation
4. Try again

### Error: "Rate limit exceeded"

**Solution:**
- Bedrock has rate limits (requests per minute)
- Wait 1 minute and try again
- Consider implementing request throttling in code

---

## 💰 Cost Information

### AWS Bedrock Pricing (Claude Sonnet 4)

**Pricing (as of 2025):**
- **Input:** ~$3 per million tokens
- **Output:** ~$15 per million tokens

**Typical Query Analysis:**
- Input: ~1,000 tokens (query + stats)
- Output: ~500 tokens (suggestions)
- **Cost per analysis:** ~$0.01 (1 cent)

**For 100 analyses:** ~$1.00
**For 1,000 analyses:** ~$10.00

### Monitor Your Usage

```bash
# Check AWS billing
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://bedrock-filter.json
```

---

## 📊 Testing Checklist

Before presentation, verify:

- [ ] AWS Access Keys created
- [ ] Keys added to `.env` file
- [ ] `AWS_BEDROCK_ENABLED=true` in `.env`
- [ ] Claude model enabled in Bedrock console
- [ ] Backend restarts successfully
- [ ] `GET /api/ai/available` returns `{"available": true}`
- [ ] `POST /api/ai/analyze` returns AI suggestions
- [ ] Frontend shows "Analyze with AI" button
- [ ] AI analysis modal displays correctly

---

## 🎓 For Presentation

### Demo Flow (2-3 minutes)

1. **Show Configuration** (30 sec)
   ```bash
   cat .env | grep AWS_BEDROCK
   ```
   Show: `AWS_BEDROCK_ENABLED=true`

2. **Test API** (30 sec)
   ```bash
   curl http://localhost:8080/api/ai/available
   ```
   Show: `{"available": true}`

3. **Show AI Analysis** (1 min)
   - Open frontend
   - Navigate to a query
   - Click "Analyze with AI"
   - Show AI suggestions appearing

4. **Explain Results** (1 min)
   - Point out optimized query
   - Highlight bottleneck analysis
   - Show improvement suggestions

### Talking Points

- "Integrated AWS Bedrock with Claude AI for query optimization"
- "AI analyzes query structure and execution metrics"
- "Provides actionable suggestions for performance improvement"
- "Uses Claude Sonnet 4, state-of-the-art language model"
- "Real-time analysis costs about $0.01 per query"

---

## 🔒 Security Best Practices

### DO NOT:
- ❌ Commit AWS keys to Git
- ❌ Share access keys publicly
- ❌ Use root account access keys
- ❌ Store keys in code files

### DO:
- ✅ Use environment variables
- ✅ Use IAM users with minimal permissions
- ✅ Rotate access keys regularly
- ✅ Add `.env` to `.gitignore`
- ✅ Use AWS credentials file (~/.aws/credentials)

### Check .gitignore

```bash
# Verify .env is ignored
cat .gitignore | grep .env
# Should show: .env
```

---

## 📞 Quick Reference

### AWS Console Login
- URL: https://console.aws.amazon.com/
- Username: `Zhengyuan_Li`
- Password: `<your console password>`

### AWS Bedrock Console
- URL: https://console.aws.amazon.com/bedrock/
- Region: US East (N. Virginia) us-east-1

### Environment Variables
```bash
AWS_BEDROCK_ENABLED=true
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI...
```

### Backend API Endpoints
- Check availability: `GET http://localhost:8080/api/ai/available`
- Analyze query: `POST http://localhost:8080/api/ai/analyze`

---

## ✅ Success Indicators

You'll know it's working when:

1. Backend logs show: "Using explicit AWS credentials from configuration"
2. API returns: `{"available": true}`
3. AI analysis completes in 2-5 seconds
4. Response contains optimized query and suggestions
5. No error messages in logs

---

**Next Steps:** Follow Step 1 to get your AWS Access Keys, then proceed through the remaining steps.

Good luck! 🚀
