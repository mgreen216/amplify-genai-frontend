# HFU AI Platform Health Check Guide

## Overview

This guide provides comprehensive instructions for running health checks on the HFU AI Platform deployment. Two health check scripts are provided:

1. **Bash Script** (`health-check.sh`) - Quick command-line health check
2. **Python Script** (`health-check.py`) - Detailed health check with reporting

## Prerequisites

### For Bash Script
- AWS CLI installed and configured
- `jq` for JSON parsing
- `curl` for endpoint testing
- Proper AWS credentials with read permissions

### For Python Script
- Python 3.7+
- Required Python packages:
  ```bash
  pip install -r requirements.txt
  ```
- AWS credentials configured

## Running Health Checks

### Quick Health Check (Bash)

```bash
# Make script executable (first time only)
chmod +x health-check.sh

# Run health check for dev environment
./health-check.sh

# You can modify the script to change:
# - REGION (default: us-east-1)
# - ENV (default: dev)
# - DOMAIN_NAME (default: genai.holyfamily.edu)
```

### Detailed Health Check (Python)

```bash
# Run with default settings (dev environment)
python health-check.py

# Run for specific environment
python health-check.py --env prod --region us-east-1

# Save report to file
python health-check.py --save-report

# Specify output filename
python health-check.py --save-report --output my_health_report.json
```

## Health Check Components

### 1. AWS Infrastructure Health

#### ECS Service Status
- Checks ECS cluster status
- Verifies running vs desired task count
- Reviews recent service events
- Monitors task health status

#### Load Balancer Health
- Verifies ALB is active
- Checks target group health
- Monitors healthy vs unhealthy targets
- Reviews target registration

#### Lambda Functions
- Verifies function state (Active/Pending)
- Checks recent error logs
- Monitors function configurations
- Reviews last modification times

#### API Gateway Status
- Checks REST API configurations
- Verifies HTTP API endpoints
- Monitors API deployment status

### 2. Application Health

#### Endpoint Testing
- Tests HTTPS application endpoint
- Checks API health endpoint
- Measures response times
- Verifies SSL/TLS configuration

#### Authentication
- Verifies Cognito User Pool status
- Checks user pool configuration
- Monitors estimated user count
- Reviews MFA settings

### 3. Database and Storage

#### DynamoDB Tables
- Checks table status (Active/Creating/Deleting)
- Monitors item count and table size
- Reviews billing mode configuration
- Verifies table accessibility

#### S3 Buckets
- Verifies bucket accessibility
- Checks versioning configuration
- Monitors bucket size
- Reviews bucket permissions

#### Secrets Manager
- Checks secret accessibility
- Monitors last access time
- Reviews rotation configuration
- Verifies secret age

### 4. Networking

#### VPC Configuration
- Verifies VPC status
- Checks subnet availability
- Monitors available IP addresses
- Reviews security group rules

#### DNS Resolution
- Verifies domain resolution
- Checks Route53 configurations
- Monitors DNS health checks

## Understanding Health Check Results

### Health Status Indicators

- **✓ (Green)** - Component is healthy and functioning normally
- **⚠ (Yellow)** - Warning condition that should be reviewed
- **✗ (Red)** - Critical issue requiring immediate attention

### Health Score Calculation

The health score is calculated as:
```
Health Score = (Successful Checks / Total Checks) × 100
```

### Overall Status Categories

1. **HEALTHY** - All checks passed, no issues found
2. **HEALTHY WITH WARNINGS** - No critical issues, but warnings present
3. **UNHEALTHY** - Critical issues detected requiring attention

## Common Issues and Fixes

### ECS Service Issues

**Problem**: Task count mismatch
```
Desired tasks: 2
Running tasks: 1
```
**Fix**: Check ECS service events for deployment issues, verify container health checks

**Problem**: Tasks failing health checks
```
Task health: UNHEALTHY
```
**Fix**: Review application logs, check target group health check configuration

### Load Balancer Issues

**Problem**: Unhealthy targets
```
Healthy targets: 0/2
```
**Fix**: 
- Verify security group allows traffic from ALB
- Check application is listening on correct port
- Review target group health check settings

### Lambda Function Issues

**Problem**: Function errors
```
Recent errors found: 15 in last hour
```
**Fix**: 
- Check CloudWatch logs for error details
- Review function configuration and permissions
- Verify environment variables are set correctly

### API Endpoint Issues

**Problem**: Endpoint returns non-200 status
```
Web endpoint returned 502
```
**Fix**:
- Check ECS service is running
- Verify load balancer target health
- Review application logs for errors

### Database Issues

**Problem**: DynamoDB table not accessible
```
Error checking table amplify-conversations: Access Denied
```
**Fix**: Verify IAM permissions for DynamoDB access

### Secrets Manager Issues

**Problem**: Secret rotation disabled
```
Rotation: Disabled
```
**Fix**: Enable automatic rotation for sensitive secrets

## Monitoring Best Practices

1. **Regular Health Checks**
   - Run health checks daily during business hours
   - Automate checks using CloudWatch Events or cron
   - Set up alerts for critical failures

2. **Log Monitoring**
   - Review CloudWatch logs regularly
   - Set up log filters for ERROR patterns
   - Create alarms for error rate thresholds

3. **Performance Monitoring**
   - Track response times for endpoints
   - Monitor Lambda function duration
   - Watch for throttling or rate limiting

4. **Cost Monitoring**
   - Review DynamoDB usage and costs
   - Monitor Lambda invocation counts
   - Check data transfer costs

## Automation

### Setting up Automated Health Checks

1. **Using CloudWatch Events**
   ```python
   # Create Lambda function with health check code
   # Schedule using CloudWatch Events rule
   ```

2. **Using Systems Manager**
   ```bash
   # Create SSM document with health check script
   # Schedule using Maintenance Windows
   ```

3. **Using CI/CD Pipeline**
   ```yaml
   # Add health check step to deployment pipeline
   - name: Run Health Check
     run: python health-check.py --env $ENVIRONMENT
   ```

## Troubleshooting

### AWS Credentials Issues
```
Error: Unable to locate credentials
```
**Fix**: Configure AWS credentials:
```bash
aws configure
```

### Permission Issues
```
Error: Access Denied
```
**Fix**: Ensure IAM role/user has required permissions:
- ECS:Describe*
- ElasticLoadBalancingV2:Describe*
- Lambda:List*, Lambda:Get*
- DynamoDB:Describe*, DynamoDB:List*
- S3:List*, S3:Get*
- CloudWatch:Describe*
- Logs:FilterLogEvents

### Network Issues
```
Error: Failed to connect to endpoint
```
**Fix**: 
- Verify network connectivity
- Check security group rules
- Ensure VPN connection if required

## Reporting

### JSON Report Format

The Python script generates detailed JSON reports:

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "environment": "dev",
  "region": "us-east-1",
  "domain": "genai.holyfamily.edu",
  "checks": {
    "ecs": {...},
    "load_balancer": {...},
    "lambda": {...},
    "dynamodb": {...},
    "s3": {...},
    "api_endpoints": {...},
    "cognito": {...},
    "cloudwatch_alarms": {...},
    "secrets_manager": {...},
    "vpc_networking": {...}
  },
  "issues": [...],
  "warnings": [...],
  "successes": [...]
}
```

### Creating Custom Reports

You can parse the JSON output to create custom reports:

```python
import json

with open('health_check_report.json', 'r') as f:
    report = json.load(f)

# Generate custom summary
print(f"Environment: {report['environment']}")
print(f"Issues: {len(report['issues'])}")
print(f"Warnings: {len(report['warnings'])}")
```

## Contact and Support

For issues or questions regarding health checks:

1. Check CloudWatch logs for detailed error information
2. Review AWS service dashboards
3. Contact the DevOps team
4. Create a support ticket with health check report attached

## Version History

- **v1.0** - Initial health check scripts
- **v1.1** - Added Python reporting capabilities
- **v1.2** - Enhanced error detection and recommendations