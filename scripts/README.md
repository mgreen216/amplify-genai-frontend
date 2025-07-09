# HFU AI Platform Health Check Scripts

This directory contains comprehensive health check tools for monitoring the HFU AI Platform deployment on AWS.

## Quick Start

1. **Install dependencies:**
   ```bash
   # For Python scripts
   pip install -r requirements.txt
   
   # For bash script (macOS)
   brew install jq
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

3. **Run health check:**
   ```bash
   # Quick bash check
   ./health-check.sh
   
   # Detailed Python check
   python health-check.py
   
   # Live dashboard
   python health-dashboard.py
   ```

## Available Scripts

### 1. `health-check.sh`
**Quick command-line health check**
- Fast execution (< 2 minutes)
- Colored output with status indicators
- Checks all major AWS components
- Perfect for daily monitoring

### 2. `health-check.py`
**Comprehensive health analysis**
- Detailed component inspection
- JSON report generation
- Customizable environment settings
- Suitable for troubleshooting

### 3. `health-dashboard.py`
**Real-time monitoring dashboard**
- Live status updates
- Visual dashboard interface
- Auto-refresh capabilities
- Ideal for NOC/monitoring setups

## Health Check Components

### Infrastructure Components
- **ECS Services** - Container orchestration
- **Load Balancers** - Traffic distribution
- **Lambda Functions** - Serverless compute
- **API Gateway** - API management
- **DynamoDB** - Database layer
- **S3 Buckets** - Object storage
- **Secrets Manager** - Credential management
- **Cognito** - Authentication
- **CloudWatch** - Monitoring and alarms
- **VPC/Networking** - Network infrastructure

### Application Components
- **Web Endpoints** - Frontend accessibility
- **API Health** - Backend API status
- **Authentication** - User login system
- **Database Connectivity** - Data layer health

## Usage Examples

### Basic Health Check
```bash
# Run with default settings (dev environment)
./health-check.sh
```

### Environment-Specific Checks
```bash
# Check production environment
python health-check.py --env prod --region us-east-1

# Check with custom domain
python health-check.py --domain myapp.example.com
```

### Report Generation
```bash
# Generate JSON report
python health-check.py --save-report

# Custom report filename
python health-check.py --save-report --output health_$(date +%Y%m%d).json
```

### Live Dashboard
```bash
# Start dashboard with 30-second refresh
python health-dashboard.py

# Custom refresh interval
python health-dashboard.py --refresh 10

# Different environment
python health-dashboard.py --env prod --region us-west-2
```

## Script Configuration

### Environment Variables
```bash
# Override default settings
export AWS_REGION=us-east-1
export ENVIRONMENT=dev
export DOMAIN_NAME=genai.holyfamily.edu
```

### Customization
Edit the scripts to modify:
- Component names and prefixes
- Health check thresholds
- Report formatting
- Alert conditions

## Output Formats

### Status Indicators
- ✅ **Green checkmark** - Component healthy
- ⚠️ **Yellow warning** - Needs attention
- ❌ **Red X** - Critical issue
- ❓ **Gray question** - Status unknown

### Report Types
1. **Console Output** - Real-time colored status
2. **JSON Reports** - Machine-readable format
3. **Dashboard View** - Visual monitoring interface

## Common Issues and Solutions

### AWS Credentials
```bash
# Problem: AWS credentials not configured
# Solution: Configure AWS CLI
aws configure
```

### Permission Issues
```bash
# Problem: Access denied errors
# Solution: Verify IAM permissions
aws sts get-caller-identity
```

### Missing Dependencies
```bash
# Problem: Command not found
# Solution: Install required tools
brew install jq  # macOS
pip install -r requirements.txt  # Python
```

### Network Connectivity
```bash
# Problem: Cannot reach endpoints
# Solution: Check network/VPN connection
curl -I https://genai.holyfamily.edu
```

## Automation

### Cron Job Setup
```bash
# Run daily health check at 9 AM
0 9 * * * /path/to/health-check.sh > /var/log/health-check.log 2>&1
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Health Check
  run: |
    python scripts/health-check.py --env ${{ env.ENVIRONMENT }}
    if [ $? -ne 0 ]; then
      echo "Health check failed"
      exit 1
    fi
```

### Lambda Function
```python
# Deploy health check as Lambda function
import boto3
from health_check import HealthChecker

def lambda_handler(event, context):
    checker = HealthChecker()
    report = checker.run_all_checks()
    return {'statusCode': 200, 'body': json.dumps(report)}
```

## Monitoring and Alerting

### CloudWatch Integration
```bash
# Send metrics to CloudWatch
aws cloudwatch put-metric-data \
  --namespace "HFU/Platform" \
  --metric-data MetricName=HealthScore,Value=85,Unit=Percent
```

### Slack Notifications
```python
# Send alerts to Slack
import requests

def send_alert(message):
    webhook_url = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
    requests.post(webhook_url, json={'text': message})
```

## Troubleshooting

### Debug Mode
```bash
# Enable verbose output
export DEBUG=true
python health-check.py --env dev
```

### Component-Specific Checks
```python
# Check only specific components
from health_check import HealthChecker

checker = HealthChecker()
ecs_status = checker.check_ecs_services()
print(f"ECS Status: {ecs_status}")
```

### Log Analysis
```bash
# Check CloudWatch logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/function-name \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000
```

## Best Practices

1. **Regular Monitoring**
   - Run health checks daily
   - Review reports weekly
   - Update thresholds quarterly

2. **Incident Response**
   - Document findings
   - Create action items
   - Follow up on fixes

3. **Continuous Improvement**
   - Enhance checks based on experience
   - Add new components as they're deployed
   - Update documentation regularly

## Contributing

To add new health checks:

1. Fork the repository
2. Add your check to the appropriate script
3. Update documentation
4. Test thoroughly
5. Submit pull request

## Support

For help with health checks:
- Check the documentation in `HEALTH_CHECK_GUIDE.md`
- Review the generated health report
- Contact the DevOps team
- Create GitHub issues for bugs

## License

These scripts are part of the HFU AI Platform and are subject to the same license terms.