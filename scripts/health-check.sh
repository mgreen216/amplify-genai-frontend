#!/bin/bash

# HFU AI Platform Health Check Script
# This script performs a comprehensive health check of the AWS infrastructure

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-1"  # Update this to your AWS region
DOMAIN_NAME="genai.holyfamily.edu"
ENV="dev"  # Update to match your environment

# Helper functions
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# Check prerequisites
print_section "Checking Prerequisites"
check_command aws
check_command jq
check_command curl

# Verify AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured properly"
    exit 1
fi
print_success "AWS CLI configured"

# Function to check ECS service
check_ecs_service() {
    print_section "ECS Service Health"
    
    # Get cluster name
    CLUSTER_NAME="${ENV}-amplify-cluster"
    SERVICE_NAME="${ENV}-amplify-service"
    
    # Check if cluster exists
    if aws ecs describe-clusters --clusters $CLUSTER_NAME --region $REGION &> /dev/null; then
        print_success "ECS Cluster '$CLUSTER_NAME' exists"
        
        # Get cluster status
        CLUSTER_STATUS=$(aws ecs describe-clusters --clusters $CLUSTER_NAME --region $REGION --query 'clusters[0].status' --output text)
        if [ "$CLUSTER_STATUS" == "ACTIVE" ]; then
            print_success "ECS Cluster is ACTIVE"
        else
            print_error "ECS Cluster status: $CLUSTER_STATUS"
        fi
        
        # Check service
        if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION &> /dev/null; then
            SERVICE_INFO=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION --query 'services[0]')
            
            DESIRED_COUNT=$(echo $SERVICE_INFO | jq -r '.desiredCount')
            RUNNING_COUNT=$(echo $SERVICE_INFO | jq -r '.runningCount')
            PENDING_COUNT=$(echo $SERVICE_INFO | jq -r '.pendingCount')
            
            print_success "ECS Service '$SERVICE_NAME' exists"
            echo "  Desired tasks: $DESIRED_COUNT"
            echo "  Running tasks: $RUNNING_COUNT"
            echo "  Pending tasks: $PENDING_COUNT"
            
            if [ "$RUNNING_COUNT" -eq "$DESIRED_COUNT" ] && [ "$PENDING_COUNT" -eq "0" ]; then
                print_success "All tasks are running"
            else
                print_warning "Task count mismatch - check service events"
            fi
            
            # Get recent events
            echo -e "\nRecent Service Events:"
            aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION \
                --query 'services[0].events[0:5].[createdAt,message]' --output table
        else
            print_error "ECS Service '$SERVICE_NAME' not found"
        fi
    else
        print_error "ECS Cluster '$CLUSTER_NAME' not found"
    fi
}

# Function to check Load Balancer
check_load_balancer() {
    print_section "Load Balancer Health"
    
    ALB_NAME="${ENV}-amplify-alb"
    
    # Get Load Balancer info
    ALB_INFO=$(aws elbv2 describe-load-balancers --region $REGION --query "LoadBalancers[?LoadBalancerName=='$ALB_NAME']" 2>/dev/null || echo "[]")
    
    if [ "$ALB_INFO" != "[]" ]; then
        ALB_ARN=$(echo $ALB_INFO | jq -r '.[0].LoadBalancerArn')
        ALB_DNS=$(echo $ALB_INFO | jq -r '.[0].DNSName')
        ALB_STATE=$(echo $ALB_INFO | jq -r '.[0].State.Code')
        
        print_success "Load Balancer '$ALB_NAME' found"
        echo "  DNS Name: $ALB_DNS"
        echo "  State: $ALB_STATE"
        
        if [ "$ALB_STATE" == "active" ]; then
            print_success "Load Balancer is active"
        else
            print_error "Load Balancer state: $ALB_STATE"
        fi
        
        # Check target health
        TARGET_GROUPS=$(aws elbv2 describe-target-groups --load-balancer-arn $ALB_ARN --region $REGION --query 'TargetGroups[*].TargetGroupArn' --output text)
        
        for TG_ARN in $TARGET_GROUPS; do
            echo -e "\nChecking Target Group: $(basename $TG_ARN)"
            
            TARGETS=$(aws elbv2 describe-target-health --target-group-arn $TG_ARN --region $REGION --query 'TargetHealthDescriptions')
            HEALTHY_COUNT=$(echo $TARGETS | jq '[.[] | select(.TargetHealth.State == "healthy")] | length')
            TOTAL_COUNT=$(echo $TARGETS | jq '. | length')
            
            echo "  Healthy targets: $HEALTHY_COUNT/$TOTAL_COUNT"
            
            if [ "$HEALTHY_COUNT" -eq "$TOTAL_COUNT" ] && [ "$TOTAL_COUNT" -gt "0" ]; then
                print_success "All targets healthy"
            else
                print_warning "Some targets unhealthy"
                echo $TARGETS | jq -r '.[] | "  Target: \(.Target.Id) - State: \(.TargetHealth.State) - Reason: \(.TargetHealth.Reason // "N/A")"'
            fi
        done
    else
        print_error "Load Balancer '$ALB_NAME' not found"
    fi
}

# Function to check Lambda functions
check_lambda_functions() {
    print_section "Lambda Functions Health"
    
    # List of Lambda function prefixes to check
    LAMBDA_PREFIXES=(
        "${ENV}-amplify-lambda"
        "${ENV}-amplify-assistants"
        "${ENV}-amplify-lambda-admin"
        "${ENV}-amplify-lambda-api"
        "${ENV}-amplify-lambda-artifacts"
        "${ENV}-amplify-lambda-js"
        "${ENV}-amplify-lambda-ops"
        "${ENV}-amplify-lambda-optimizer"
        "${ENV}-chat-billing"
        "${ENV}-data-disclosure"
        "${ENV}-amplify-embedding"
        "${ENV}-amplify-object-access"
    )
    
    for PREFIX in "${LAMBDA_PREFIXES[@]}"; do
        FUNCTIONS=$(aws lambda list-functions --region $REGION --query "Functions[?starts_with(FunctionName, '$PREFIX')].FunctionName" --output text)
        
        if [ -n "$FUNCTIONS" ]; then
            for FUNC in $FUNCTIONS; do
                FUNC_INFO=$(aws lambda get-function --function-name $FUNC --region $REGION 2>/dev/null || echo "{}")
                
                if [ "$FUNC_INFO" != "{}" ]; then
                    STATE=$(echo $FUNC_INFO | jq -r '.Configuration.State')
                    LAST_MODIFIED=$(echo $FUNC_INFO | jq -r '.Configuration.LastModified')
                    
                    if [ "$STATE" == "Active" ]; then
                        print_success "$FUNC - State: $STATE (Last Modified: $LAST_MODIFIED)"
                    else
                        print_warning "$FUNC - State: $STATE"
                    fi
                    
                    # Check recent errors
                    ERROR_COUNT=$(aws logs filter-log-events \
                        --log-group-name "/aws/lambda/$FUNC" \
                        --start-time $(($(date +%s) - 3600))000 \
                        --filter-pattern "ERROR" \
                        --region $REGION \
                        --query 'events | length(@)' \
                        --output text 2>/dev/null || echo "0")
                    
                    if [ "$ERROR_COUNT" -gt "0" ]; then
                        print_warning "  Recent errors found: $ERROR_COUNT in last hour"
                    fi
                else
                    print_error "$FUNC - Not found or inaccessible"
                fi
            done
        else
            print_warning "No functions found with prefix: $PREFIX"
        fi
    done
}

# Function to check API Gateway
check_api_gateway() {
    print_section "API Gateway Health"
    
    # Check REST APIs
    REST_APIS=$(aws apigateway get-rest-apis --region $REGION --query "items[?contains(name, '$ENV')]" 2>/dev/null || echo "[]")
    
    if [ "$REST_APIS" != "[]" ]; then
        echo "$REST_APIS" | jq -r '.[] | "\(.name) - ID: \(.id)"' | while read -r API_INFO; do
            print_success "Found API: $API_INFO"
        done
    else
        print_warning "No REST APIs found for environment: $ENV"
    fi
    
    # Check HTTP APIs (API Gateway v2)
    HTTP_APIS=$(aws apigatewayv2 get-apis --region $REGION --query "Items[?contains(Name, '$ENV')]" 2>/dev/null || echo "[]")
    
    if [ "$HTTP_APIS" != "[]" ]; then
        echo "$HTTP_APIS" | jq -r '.[] | "\(.Name) - ID: \(.ApiId) - Endpoint: \(.ApiEndpoint)"' | while read -r API_INFO; do
            print_success "Found HTTP API: $API_INFO"
        done
    fi
}

# Function to check DynamoDB tables
check_dynamodb() {
    print_section "DynamoDB Tables Health"
    
    # Common table name patterns
    TABLE_PATTERNS=(
        "${ENV}-amplify"
        "${ENV}-chat"
        "${ENV}-conversations"
        "${ENV}-user"
        "${ENV}-assistant"
        "${ENV}-billing"
    )
    
    for PATTERN in "${TABLE_PATTERNS[@]}"; do
        TABLES=$(aws dynamodb list-tables --region $REGION --query "TableNames[?contains(@, '$PATTERN')]" --output text)
        
        for TABLE in $TABLES; do
            if [ -n "$TABLE" ]; then
                TABLE_STATUS=$(aws dynamodb describe-table --table-name $TABLE --region $REGION --query 'Table.TableStatus' --output text 2>/dev/null || echo "NOT_FOUND")
                
                if [ "$TABLE_STATUS" == "ACTIVE" ]; then
                    print_success "$TABLE - Status: $TABLE_STATUS"
                    
                    # Get table metrics
                    ITEM_COUNT=$(aws dynamodb describe-table --table-name $TABLE --region $REGION --query 'Table.ItemCount' --output text)
                    TABLE_SIZE=$(aws dynamodb describe-table --table-name $TABLE --region $REGION --query 'Table.TableSizeBytes' --output text)
                    
                    echo "  Items: $ITEM_COUNT, Size: $((TABLE_SIZE / 1024 / 1024)) MB"
                elif [ "$TABLE_STATUS" == "NOT_FOUND" ]; then
                    print_error "$TABLE - Not found"
                else
                    print_warning "$TABLE - Status: $TABLE_STATUS"
                fi
            fi
        done
    done
}

# Function to check S3 buckets
check_s3_buckets() {
    print_section "S3 Buckets Health"
    
    BUCKETS=$(aws s3 ls | grep -i "$ENV" | awk '{print $3}' || true)
    
    if [ -n "$BUCKETS" ]; then
        for BUCKET in $BUCKETS; do
            # Check if bucket exists and is accessible
            if aws s3api head-bucket --bucket $BUCKET 2>/dev/null; then
                print_success "$BUCKET - Accessible"
                
                # Get bucket size
                BUCKET_SIZE=$(aws s3 ls s3://$BUCKET --recursive --summarize 2>/dev/null | grep "Total Size" | awk '{print $3}' || echo "0")
                if [ -n "$BUCKET_SIZE" ] && [ "$BUCKET_SIZE" != "0" ]; then
                    echo "  Size: $((BUCKET_SIZE / 1024 / 1024)) MB"
                fi
                
                # Check bucket versioning
                VERSIONING=$(aws s3api get-bucket-versioning --bucket $BUCKET --query 'Status' --output text 2>/dev/null || echo "Not configured")
                echo "  Versioning: $VERSIONING"
            else
                print_error "$BUCKET - Not accessible"
            fi
        done
    else
        print_warning "No S3 buckets found for environment: $ENV"
    fi
}

# Function to check Secrets Manager
check_secrets_manager() {
    print_section "Secrets Manager Health"
    
    SECRETS=$(aws secretsmanager list-secrets --region $REGION --query "SecretList[?contains(Name, '$ENV')].[Name]" --output text)
    
    if [ -n "$SECRETS" ]; then
        for SECRET in $SECRETS; do
            SECRET_INFO=$(aws secretsmanager describe-secret --secret-id $SECRET --region $REGION 2>/dev/null || echo "{}")
            
            if [ "$SECRET_INFO" != "{}" ]; then
                LAST_ACCESSED=$(echo $SECRET_INFO | jq -r '.LastAccessedDate // "Never"')
                LAST_CHANGED=$(echo $SECRET_INFO | jq -r '.LastChangedDate // "Unknown"')
                
                print_success "$SECRET"
                echo "  Last Accessed: $LAST_ACCESSED"
                echo "  Last Changed: $LAST_CHANGED"
            else
                print_error "$SECRET - Not accessible"
            fi
        done
    else
        print_warning "No secrets found for environment: $ENV"
    fi
}

# Function to check CloudWatch alarms
check_cloudwatch_alarms() {
    print_section "CloudWatch Alarms"
    
    ALARMS=$(aws cloudwatch describe-alarms --region $REGION --query "MetricAlarms[?contains(AlarmName, '$ENV')]" 2>/dev/null || echo "[]")
    
    if [ "$ALARMS" != "[]" ]; then
        ALARM_COUNT=$(echo $ALARMS | jq '. | length')
        OK_COUNT=$(echo $ALARMS | jq '[.[] | select(.StateValue == "OK")] | length')
        ALARM_TRIGGERED=$(echo $ALARMS | jq '[.[] | select(.StateValue == "ALARM")] | length')
        
        echo "Total Alarms: $ALARM_COUNT"
        echo "OK: $OK_COUNT"
        echo "In Alarm: $ALARM_TRIGGERED"
        
        if [ "$ALARM_TRIGGERED" -gt "0" ]; then
            print_error "Active alarms detected!"
            echo $ALARMS | jq -r '.[] | select(.StateValue == "ALARM") | "  - \(.AlarmName): \(.StateReason)"'
        else
            print_success "All alarms in OK state"
        fi
    else
        print_warning "No CloudWatch alarms found for environment: $ENV"
    fi
}

# Function to test application endpoint
test_application_endpoint() {
    print_section "Application Endpoint Test"
    
    # Test HTTPS endpoint
    echo "Testing https://$DOMAIN_NAME..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN_NAME" --max-time 10 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" == "200" ]; then
        print_success "Application endpoint returned HTTP 200"
    elif [ "$HTTP_CODE" == "000" ]; then
        print_error "Failed to connect to application endpoint"
    else
        print_warning "Application endpoint returned HTTP $HTTP_CODE"
    fi
    
    # Test API health endpoint if available
    API_HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN_NAME/api/health" --max-time 10 2>/dev/null || echo "000")
    
    if [ "$API_HEALTH_CODE" == "200" ]; then
        print_success "API health endpoint returned HTTP 200"
    elif [ "$API_HEALTH_CODE" == "404" ]; then
        print_warning "API health endpoint not found (404)"
    elif [ "$API_HEALTH_CODE" == "000" ]; then
        print_error "Failed to connect to API health endpoint"
    else
        print_warning "API health endpoint returned HTTP $API_HEALTH_CODE"
    fi
}

# Function to check Cognito User Pool
check_cognito() {
    print_section "Cognito User Pool Health"
    
    USER_POOL_NAME="${ENV}-amplify-userpool"
    
    USER_POOLS=$(aws cognito-idp list-user-pools --max-results 50 --region $REGION --query "UserPools[?contains(Name, '$USER_POOL_NAME')]" 2>/dev/null || echo "[]")
    
    if [ "$USER_POOLS" != "[]" ]; then
        echo "$USER_POOLS" | jq -r '.[] | "Pool: \(.Name) - ID: \(.Id)"' | while read -r POOL_INFO; do
            print_success "$POOL_INFO"
            
            # Extract pool ID
            POOL_ID=$(echo "$POOL_INFO" | awk -F'ID: ' '{print $2}')
            
            # Get user pool details
            POOL_DETAILS=$(aws cognito-idp describe-user-pool --user-pool-id "$POOL_ID" --region $REGION 2>/dev/null || echo "{}")
            
            if [ "$POOL_DETAILS" != "{}" ]; then
                USER_COUNT=$(echo $POOL_DETAILS | jq -r '.UserPool.EstimatedNumberOfUsers // 0')
                STATUS=$(echo $POOL_DETAILS | jq -r '.UserPool.Status // "Unknown"')
                
                echo "  Status: $STATUS"
                echo "  Estimated Users: $USER_COUNT"
            fi
        done
    else
        print_warning "No Cognito User Pools found for: $USER_POOL_NAME"
    fi
}

# Function to generate summary report
generate_summary() {
    print_section "Health Check Summary"
    
    echo "Environment: $ENV"
    echo "Region: $REGION"
    echo "Domain: $DOMAIN_NAME"
    echo "Timestamp: $(date)"
    
    # Create a simple health score based on checks performed
    # This is a simplified scoring - adjust based on your needs
    HEALTH_SCORE=100
    ISSUES_FOUND=0
    
    # You would need to track failures from above checks to calculate this properly
    
    if [ $ISSUES_FOUND -eq 0 ]; then
        print_success "Overall Health: HEALTHY"
    else
        print_warning "Overall Health: DEGRADED - $ISSUES_FOUND issues found"
    fi
}

# Main execution
main() {
    echo "================================================"
    echo "HFU AI Platform Health Check"
    echo "================================================"
    
    # Run all health checks
    check_ecs_service
    check_load_balancer
    check_lambda_functions
    check_api_gateway
    check_dynamodb
    check_s3_buckets
    check_secrets_manager
    check_cognito
    check_cloudwatch_alarms
    test_application_endpoint
    
    # Generate summary
    generate_summary
    
    echo -e "\n================================================"
    echo "Health Check Complete"
    echo "================================================"
}

# Run main function
main