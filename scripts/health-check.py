#!/usr/bin/env python3

"""
HFU AI Platform Health Check Script (Python Version)
This script performs a comprehensive health check of the AWS infrastructure
and generates a detailed health report.
"""

import boto3
import json
import requests
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
import argparse
from tabulate import tabulate
import time

# ANSI color codes
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class HealthChecker:
    def __init__(self, env: str = 'dev', region: str = 'us-east-1', domain: str = 'genai.holyfamily.edu'):
        self.env = env
        self.region = region
        self.domain = domain
        self.report = {
            'timestamp': datetime.now().isoformat(),
            'environment': env,
            'region': region,
            'domain': domain,
            'checks': {},
            'issues': [],
            'warnings': [],
            'successes': []
        }
        
        # Initialize AWS clients
        self.ecs = boto3.client('ecs', region_name=region)
        self.elbv2 = boto3.client('elbv2', region_name=region)
        self.lambda_client = boto3.client('lambda', region_name=region)
        self.dynamodb = boto3.client('dynamodb', region_name=region)
        self.s3 = boto3.client('s3', region_name=region)
        self.secretsmanager = boto3.client('secretsmanager', region_name=region)
        self.cloudwatch = boto3.client('cloudwatch', region_name=region)
        self.logs = boto3.client('logs', region_name=region)
        self.apigateway = boto3.client('apigateway', region_name=region)
        self.apigatewayv2 = boto3.client('apigatewayv2', region_name=region)
        self.cognito = boto3.client('cognito-idp', region_name=region)
        self.ec2 = boto3.client('ec2', region_name=region)

    def print_section(self, title: str):
        print(f"\n{Colors.BLUE}{'=' * 60}{Colors.ENDC}")
        print(f"{Colors.BLUE}{Colors.BOLD}{title}{Colors.ENDC}")
        print(f"{Colors.BLUE}{'=' * 60}{Colors.ENDC}")

    def print_success(self, message: str):
        print(f"{Colors.GREEN}✓ {message}{Colors.ENDC}")
        self.report['successes'].append(message)

    def print_warning(self, message: str):
        print(f"{Colors.YELLOW}⚠ {message}{Colors.ENDC}")
        self.report['warnings'].append(message)

    def print_error(self, message: str):
        print(f"{Colors.RED}✗ {message}{Colors.ENDC}")
        self.report['issues'].append(message)

    def check_ecs_services(self) -> Dict[str, Any]:
        """Check ECS cluster and services health"""
        self.print_section("ECS Services Health Check")
        
        cluster_name = f"{self.env}-amplify-cluster"
        service_name = f"{self.env}-amplify-service"
        results = {'cluster': None, 'services': [], 'tasks': []}
        
        try:
            # Check cluster
            clusters = self.ecs.describe_clusters(clusters=[cluster_name])
            if clusters['clusters']:
                cluster = clusters['clusters'][0]
                results['cluster'] = {
                    'name': cluster['clusterName'],
                    'status': cluster['status'],
                    'running_tasks': cluster['runningTasksCount'],
                    'pending_tasks': cluster['pendingTasksCount']
                }
                
                if cluster['status'] == 'ACTIVE':
                    self.print_success(f"ECS Cluster '{cluster_name}' is ACTIVE")
                else:
                    self.print_error(f"ECS Cluster '{cluster_name}' status: {cluster['status']}")
                
                # Check services
                services = self.ecs.describe_services(
                    cluster=cluster_name,
                    services=[service_name]
                )
                
                if services['services']:
                    service = services['services'][0]
                    results['services'].append({
                        'name': service['serviceName'],
                        'status': service['status'],
                        'desired_count': service['desiredCount'],
                        'running_count': service['runningCount'],
                        'pending_count': service['pendingCount']
                    })
                    
                    print(f"\nService: {service['serviceName']}")
                    print(f"  Status: {service['status']}")
                    print(f"  Desired: {service['desiredCount']}")
                    print(f"  Running: {service['runningCount']}")
                    print(f"  Pending: {service['pendingCount']}")
                    
                    if service['runningCount'] == service['desiredCount']:
                        self.print_success("All tasks are running")
                    else:
                        self.print_warning("Task count mismatch")
                    
                    # Show recent events
                    print("\nRecent Service Events:")
                    events = service.get('events', [])[:5]
                    for event in events:
                        print(f"  {event['createdAt'].strftime('%Y-%m-%d %H:%M:%S')} - {event['message']}")
                    
                    # Check task health
                    if service['runningCount'] > 0:
                        tasks = self.ecs.list_tasks(
                            cluster=cluster_name,
                            serviceName=service_name
                        )
                        
                        if tasks['taskArns']:
                            task_details = self.ecs.describe_tasks(
                                cluster=cluster_name,
                                tasks=tasks['taskArns']
                            )
                            
                            for task in task_details['tasks']:
                                results['tasks'].append({
                                    'id': task['taskArn'].split('/')[-1],
                                    'status': task['lastStatus'],
                                    'health': task.get('healthStatus', 'UNKNOWN')
                                })
                else:
                    self.print_error(f"Service '{service_name}' not found")
            else:
                self.print_error(f"Cluster '{cluster_name}' not found")
                
        except Exception as e:
            self.print_error(f"Error checking ECS: {str(e)}")
            
        self.report['checks']['ecs'] = results
        return results

    def check_load_balancer(self) -> Dict[str, Any]:
        """Check Application Load Balancer health"""
        self.print_section("Load Balancer Health Check")
        
        alb_name = f"{self.env}-amplify-alb"
        results = {'load_balancer': None, 'target_groups': []}
        
        try:
            # Find load balancer
            lbs = self.elbv2.describe_load_balancers()
            alb = None
            
            for lb in lbs['LoadBalancers']:
                if lb['LoadBalancerName'] == alb_name:
                    alb = lb
                    break
            
            if alb:
                results['load_balancer'] = {
                    'name': alb['LoadBalancerName'],
                    'dns': alb['DNSName'],
                    'state': alb['State']['Code'],
                    'scheme': alb['Scheme']
                }
                
                self.print_success(f"Load Balancer '{alb_name}' found")
                print(f"  DNS: {alb['DNSName']}")
                print(f"  State: {alb['State']['Code']}")
                
                # Check target groups
                target_groups = self.elbv2.describe_target_groups(
                    LoadBalancerArn=alb['LoadBalancerArn']
                )
                
                for tg in target_groups['TargetGroups']:
                    print(f"\nTarget Group: {tg['TargetGroupName']}")
                    
                    # Check target health
                    health = self.elbv2.describe_target_health(
                        TargetGroupArn=tg['TargetGroupArn']
                    )
                    
                    healthy = sum(1 for t in health['TargetHealthDescriptions'] 
                                if t['TargetHealth']['State'] == 'healthy')
                    total = len(health['TargetHealthDescriptions'])
                    
                    results['target_groups'].append({
                        'name': tg['TargetGroupName'],
                        'healthy_targets': healthy,
                        'total_targets': total
                    })
                    
                    print(f"  Healthy targets: {healthy}/{total}")
                    
                    if healthy == total and total > 0:
                        self.print_success("All targets healthy")
                    elif total == 0:
                        self.print_warning("No targets registered")
                    else:
                        self.print_warning("Some targets unhealthy")
                        for target in health['TargetHealthDescriptions']:
                            if target['TargetHealth']['State'] != 'healthy':
                                print(f"    Target {target['Target']['Id']}: {target['TargetHealth']['State']}")
            else:
                self.print_error(f"Load Balancer '{alb_name}' not found")
                
        except Exception as e:
            self.print_error(f"Error checking Load Balancer: {str(e)}")
            
        self.report['checks']['load_balancer'] = results
        return results

    def check_lambda_functions(self) -> Dict[str, List[Dict[str, Any]]]:
        """Check Lambda functions health"""
        self.print_section("Lambda Functions Health Check")
        
        prefixes = [
            f"{self.env}-amplify-lambda",
            f"{self.env}-amplify-assistants",
            f"{self.env}-amplify-lambda-admin",
            f"{self.env}-amplify-lambda-api",
            f"{self.env}-amplify-lambda-artifacts",
            f"{self.env}-amplify-lambda-js",
            f"{self.env}-amplify-lambda-ops",
            f"{self.env}-amplify-lambda-optimizer",
            f"{self.env}-chat-billing",
            f"{self.env}-data-disclosure",
            f"{self.env}-amplify-embedding",
            f"{self.env}-amplify-object-access"
        ]
        
        results = {}
        
        try:
            # Get all functions
            paginator = self.lambda_client.get_paginator('list_functions')
            all_functions = []
            
            for page in paginator.paginate():
                all_functions.extend(page['Functions'])
            
            # Check functions by prefix
            for prefix in prefixes:
                functions = [f for f in all_functions if f['FunctionName'].startswith(prefix)]
                
                if functions:
                    results[prefix] = []
                    for func in functions:
                        func_info = {
                            'name': func['FunctionName'],
                            'state': func.get('State', 'Unknown'),
                            'runtime': func.get('Runtime', 'Unknown'),
                            'last_modified': func.get('LastModified', 'Unknown'),
                            'errors_last_hour': 0
                        }
                        
                        if func.get('State') == 'Active':
                            self.print_success(f"{func['FunctionName']} - Active")
                        else:
                            self.print_warning(f"{func['FunctionName']} - {func.get('State', 'Unknown')}")
                        
                        # Check for recent errors
                        try:
                            log_group = f"/aws/lambda/{func['FunctionName']}"
                            one_hour_ago = int((datetime.now() - timedelta(hours=1)).timestamp() * 1000)
                            
                            response = self.logs.filter_log_events(
                                logGroupName=log_group,
                                startTime=one_hour_ago,
                                filterPattern='ERROR'
                            )
                            
                            error_count = len(response.get('events', []))
                            func_info['errors_last_hour'] = error_count
                            
                            if error_count > 0:
                                self.print_warning(f"  {error_count} errors in last hour")
                                
                        except:
                            pass  # Log group might not exist
                        
                        results[prefix].append(func_info)
                else:
                    self.print_warning(f"No functions found with prefix: {prefix}")
                    
        except Exception as e:
            self.print_error(f"Error checking Lambda functions: {str(e)}")
            
        self.report['checks']['lambda'] = results
        return results

    def check_dynamodb_tables(self) -> Dict[str, List[Dict[str, Any]]]:
        """Check DynamoDB tables health"""
        self.print_section("DynamoDB Tables Health Check")
        
        patterns = [
            f"{self.env}-amplify",
            f"{self.env}-chat",
            f"{self.env}-conversations",
            f"{self.env}-user",
            f"{self.env}-assistant",
            f"{self.env}-billing"
        ]
        
        results = []
        
        try:
            # List all tables
            all_tables = []
            paginator = self.dynamodb.get_paginator('list_tables')
            
            for page in paginator.paginate():
                all_tables.extend(page['TableNames'])
            
            # Check tables matching patterns
            for pattern in patterns:
                matching_tables = [t for t in all_tables if pattern in t]
                
                for table_name in matching_tables:
                    try:
                        table = self.dynamodb.describe_table(TableName=table_name)['Table']
                        
                        table_info = {
                            'name': table_name,
                            'status': table['TableStatus'],
                            'item_count': table.get('ItemCount', 0),
                            'size_mb': table.get('TableSizeBytes', 0) / (1024 * 1024),
                            'billing_mode': table.get('BillingModeSummary', {}).get('BillingMode', 'PROVISIONED')
                        }
                        
                        results.append(table_info)
                        
                        if table['TableStatus'] == 'ACTIVE':
                            self.print_success(f"{table_name} - ACTIVE")
                            print(f"  Items: {table_info['item_count']:,}")
                            print(f"  Size: {table_info['size_mb']:.2f} MB")
                            print(f"  Billing: {table_info['billing_mode']}")
                        else:
                            self.print_warning(f"{table_name} - {table['TableStatus']}")
                            
                    except Exception as e:
                        self.print_error(f"Error checking table {table_name}: {str(e)}")
                        
        except Exception as e:
            self.print_error(f"Error checking DynamoDB: {str(e)}")
            
        self.report['checks']['dynamodb'] = results
        return results

    def check_s3_buckets(self) -> List[Dict[str, Any]]:
        """Check S3 buckets health"""
        self.print_section("S3 Buckets Health Check")
        
        results = []
        
        try:
            # List all buckets
            buckets = self.s3.list_buckets()['Buckets']
            
            # Filter buckets by environment
            env_buckets = [b for b in buckets if self.env in b['Name']]
            
            for bucket in env_buckets:
                bucket_name = bucket['Name']
                bucket_info = {
                    'name': bucket_name,
                    'creation_date': bucket['CreationDate'].isoformat(),
                    'accessible': False,
                    'versioning': 'Unknown',
                    'size_mb': 0
                }
                
                try:
                    # Check if bucket is accessible
                    self.s3.head_bucket(Bucket=bucket_name)
                    bucket_info['accessible'] = True
                    
                    # Check versioning
                    versioning = self.s3.get_bucket_versioning(Bucket=bucket_name)
                    bucket_info['versioning'] = versioning.get('Status', 'Disabled')
                    
                    # Get bucket size (approximate)
                    paginator = self.s3.get_paginator('list_objects_v2')
                    size = 0
                    
                    for page in paginator.paginate(Bucket=bucket_name):
                        for obj in page.get('Contents', []):
                            size += obj.get('Size', 0)
                    
                    bucket_info['size_mb'] = size / (1024 * 1024)
                    
                    self.print_success(f"{bucket_name} - Accessible")
                    print(f"  Size: {bucket_info['size_mb']:.2f} MB")
                    print(f"  Versioning: {bucket_info['versioning']}")
                    
                except Exception as e:
                    self.print_error(f"{bucket_name} - Error: {str(e)}")
                    
                results.append(bucket_info)
                
        except Exception as e:
            self.print_error(f"Error checking S3: {str(e)}")
            
        self.report['checks']['s3'] = results
        return results

    def check_api_endpoints(self) -> Dict[str, Any]:
        """Check API endpoints health"""
        self.print_section("API Endpoints Health Check")
        
        results = {
            'web_endpoint': {},
            'api_health': {},
            'api_gateway': []
        }
        
        # Check web endpoint
        try:
            url = f"https://{self.domain}"
            response = requests.get(url, timeout=10)
            
            results['web_endpoint'] = {
                'url': url,
                'status_code': response.status_code,
                'response_time_ms': response.elapsed.total_seconds() * 1000
            }
            
            if response.status_code == 200:
                self.print_success(f"Web endpoint returned {response.status_code}")
            else:
                self.print_warning(f"Web endpoint returned {response.status_code}")
                
            print(f"  Response time: {results['web_endpoint']['response_time_ms']:.2f}ms")
            
        except Exception as e:
            self.print_error(f"Failed to reach web endpoint: {str(e)}")
            results['web_endpoint']['error'] = str(e)
        
        # Check API health endpoint
        try:
            url = f"https://{self.domain}/api/health"
            response = requests.get(url, timeout=10)
            
            results['api_health'] = {
                'url': url,
                'status_code': response.status_code,
                'response_time_ms': response.elapsed.total_seconds() * 1000
            }
            
            if response.status_code == 200:
                self.print_success(f"API health endpoint returned {response.status_code}")
            elif response.status_code == 404:
                self.print_warning("API health endpoint not implemented (404)")
            else:
                self.print_warning(f"API health endpoint returned {response.status_code}")
                
        except Exception as e:
            self.print_error(f"Failed to reach API health endpoint: {str(e)}")
            results['api_health']['error'] = str(e)
        
        # Check API Gateway
        try:
            # REST APIs
            rest_apis = self.apigateway.get_rest_apis()
            for api in rest_apis.get('items', []):
                if self.env in api.get('name', ''):
                    results['api_gateway'].append({
                        'type': 'REST',
                        'name': api['name'],
                        'id': api['id']
                    })
                    self.print_success(f"Found REST API: {api['name']}")
            
            # HTTP APIs
            http_apis = self.apigatewayv2.get_apis()
            for api in http_apis.get('Items', []):
                if self.env in api.get('Name', ''):
                    results['api_gateway'].append({
                        'type': 'HTTP',
                        'name': api['Name'],
                        'id': api['ApiId'],
                        'endpoint': api.get('ApiEndpoint', '')
                    })
                    self.print_success(f"Found HTTP API: {api['Name']}")
                    
        except Exception as e:
            self.print_error(f"Error checking API Gateway: {str(e)}")
            
        self.report['checks']['api_endpoints'] = results
        return results

    def check_cognito(self) -> Dict[str, Any]:
        """Check Cognito User Pool health"""
        self.print_section("Cognito User Pool Health Check")
        
        results = {'user_pools': []}
        pool_name = f"{self.env}-amplify-userpool"
        
        try:
            # List user pools
            pools = self.cognito.list_user_pools(MaxResults=50)
            
            for pool in pools.get('UserPools', []):
                if pool_name in pool['Name']:
                    # Get detailed pool info
                    pool_details = self.cognito.describe_user_pool(
                        UserPoolId=pool['Id']
                    )['UserPool']
                    
                    pool_info = {
                        'name': pool['Name'],
                        'id': pool['Id'],
                        'status': pool_details.get('Status', 'Unknown'),
                        'user_count': pool_details.get('EstimatedNumberOfUsers', 0),
                        'mfa_config': pool_details.get('MfaConfiguration', 'OFF')
                    }
                    
                    results['user_pools'].append(pool_info)
                    
                    self.print_success(f"Found User Pool: {pool['Name']}")
                    print(f"  Status: {pool_info['status']}")
                    print(f"  Estimated Users: {pool_info['user_count']:,}")
                    print(f"  MFA: {pool_info['mfa_config']}")
                    
        except Exception as e:
            self.print_error(f"Error checking Cognito: {str(e)}")
            
        self.report['checks']['cognito'] = results
        return results

    def check_cloudwatch_alarms(self) -> Dict[str, Any]:
        """Check CloudWatch alarms"""
        self.print_section("CloudWatch Alarms Health Check")
        
        results = {
            'total': 0,
            'ok': 0,
            'alarm': 0,
            'insufficient_data': 0,
            'active_alarms': []
        }
        
        try:
            # Get all alarms
            paginator = self.cloudwatch.get_paginator('describe_alarms')
            all_alarms = []
            
            for page in paginator.paginate():
                all_alarms.extend(page['MetricAlarms'])
            
            # Filter by environment
            env_alarms = [a for a in all_alarms if self.env in a.get('AlarmName', '')]
            
            results['total'] = len(env_alarms)
            
            for alarm in env_alarms:
                state = alarm['StateValue']
                
                if state == 'OK':
                    results['ok'] += 1
                elif state == 'ALARM':
                    results['alarm'] += 1
                    results['active_alarms'].append({
                        'name': alarm['AlarmName'],
                        'reason': alarm.get('StateReason', 'Unknown')
                    })
                else:
                    results['insufficient_data'] += 1
            
            print(f"Total Alarms: {results['total']}")
            print(f"  OK: {results['ok']}")
            print(f"  In Alarm: {results['alarm']}")
            print(f"  Insufficient Data: {results['insufficient_data']}")
            
            if results['alarm'] > 0:
                self.print_error(f"{results['alarm']} active alarms!")
                for alarm in results['active_alarms']:
                    print(f"  - {alarm['name']}: {alarm['reason']}")
            elif results['total'] > 0:
                self.print_success("All alarms in OK state")
            else:
                self.print_warning("No alarms found")
                
        except Exception as e:
            self.print_error(f"Error checking CloudWatch alarms: {str(e)}")
            
        self.report['checks']['cloudwatch_alarms'] = results
        return results

    def check_secrets_manager(self) -> List[Dict[str, Any]]:
        """Check Secrets Manager"""
        self.print_section("Secrets Manager Health Check")
        
        results = []
        
        try:
            # List secrets
            paginator = self.secretsmanager.get_paginator('list_secrets')
            all_secrets = []
            
            for page in paginator.paginate():
                all_secrets.extend(page['SecretList'])
            
            # Filter by environment
            env_secrets = [s for s in all_secrets if self.env in s.get('Name', '')]
            
            for secret in env_secrets:
                secret_info = {
                    'name': secret['Name'],
                    'last_accessed': secret.get('LastAccessedDate', 'Never'),
                    'last_changed': secret.get('LastChangedDate', 'Unknown'),
                    'rotation_enabled': secret.get('RotationEnabled', False)
                }
                
                results.append(secret_info)
                
                self.print_success(f"{secret['Name']}")
                
                if isinstance(secret_info['last_accessed'], datetime):
                    days_since_access = (datetime.now(secret_info['last_accessed'].tzinfo) - secret_info['last_accessed']).days
                    print(f"  Last accessed: {days_since_access} days ago")
                else:
                    print(f"  Last accessed: Never")
                
                if secret_info['rotation_enabled']:
                    print(f"  Rotation: Enabled")
                else:
                    self.print_warning("  Rotation: Disabled")
                    
        except Exception as e:
            self.print_error(f"Error checking Secrets Manager: {str(e)}")
            
        self.report['checks']['secrets_manager'] = results
        return results

    def check_vpc_and_networking(self) -> Dict[str, Any]:
        """Check VPC and networking configuration"""
        self.print_section("VPC and Networking Health Check")
        
        results = {
            'vpcs': [],
            'security_groups': [],
            'subnets': []
        }
        
        try:
            # Get VPCs
            vpcs = self.ec2.describe_vpcs(
                Filters=[
                    {'Name': 'tag:Name', 'Values': [f'*{self.env}*']}
                ]
            )
            
            for vpc in vpcs['Vpcs']:
                vpc_info = {
                    'id': vpc['VpcId'],
                    'cidr': vpc['CidrBlock'],
                    'state': vpc['State']
                }
                
                results['vpcs'].append(vpc_info)
                
                self.print_success(f"VPC {vpc['VpcId']} - {vpc['State']}")
                print(f"  CIDR: {vpc['CidrBlock']}")
                
                # Get subnets
                subnets = self.ec2.describe_subnets(
                    Filters=[
                        {'Name': 'vpc-id', 'Values': [vpc['VpcId']]}
                    ]
                )
                
                for subnet in subnets['Subnets']:
                    subnet_info = {
                        'id': subnet['SubnetId'],
                        'cidr': subnet['CidrBlock'],
                        'az': subnet['AvailabilityZone'],
                        'available_ips': subnet['AvailableIpAddressCount']
                    }
                    results['subnets'].append(subnet_info)
                
                print(f"  Subnets: {len(subnets['Subnets'])}")
                
            # Get security groups
            sgs = self.ec2.describe_security_groups(
                Filters=[
                    {'Name': 'tag:Name', 'Values': [f'*{self.env}*']}
                ]
            )
            
            for sg in sgs['SecurityGroups']:
                sg_info = {
                    'id': sg['GroupId'],
                    'name': sg['GroupName'],
                    'ingress_rules': len(sg['IpPermissions']),
                    'egress_rules': len(sg['IpPermissionsEgress'])
                }
                results['security_groups'].append(sg_info)
                
            print(f"\nSecurity Groups: {len(sgs['SecurityGroups'])}")
            
        except Exception as e:
            self.print_error(f"Error checking VPC/Networking: {str(e)}")
            
        self.report['checks']['vpc_networking'] = results
        return results

    def generate_summary_report(self):
        """Generate and display summary report"""
        self.print_section("Health Check Summary Report")
        
        print(f"\nEnvironment: {self.env}")
        print(f"Region: {self.region}")
        print(f"Domain: {self.domain}")
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Calculate health score
        total_checks = len(self.report['successes']) + len(self.report['warnings']) + len(self.report['issues'])
        if total_checks > 0:
            health_score = (len(self.report['successes']) / total_checks) * 100
        else:
            health_score = 0
        
        print(f"\nHealth Score: {health_score:.1f}%")
        print(f"Successes: {len(self.report['successes'])}")
        print(f"Warnings: {len(self.report['warnings'])}")
        print(f"Issues: {len(self.report['issues'])}")
        
        # Overall status
        if len(self.report['issues']) == 0 and len(self.report['warnings']) == 0:
            self.print_success("\nOVERALL STATUS: HEALTHY")
        elif len(self.report['issues']) == 0:
            self.print_warning(f"\nOVERALL STATUS: HEALTHY WITH WARNINGS ({len(self.report['warnings'])} warnings)")
        else:
            self.print_error(f"\nOVERALL STATUS: UNHEALTHY ({len(self.report['issues'])} issues)")
        
        # Top issues
        if self.report['issues']:
            print("\nTop Issues:")
            for i, issue in enumerate(self.report['issues'][:5], 1):
                print(f"  {i}. {issue}")
        
        # Recommendations
        print("\nRecommendations:")
        if len(self.report['issues']) > 0:
            print("  1. Address critical issues immediately")
            print("  2. Check CloudWatch logs for detailed error information")
            print("  3. Verify service configurations match expected values")
        
        if len(self.report['warnings']) > 0:
            print("  1. Review warnings to prevent future issues")
            print("  2. Consider implementing missing health endpoints")
            print("  3. Enable rotation for secrets where applicable")
        
        if health_score == 100:
            print("  1. Continue monitoring for any changes")
            print("  2. Consider implementing additional health checks")
            print("  3. Review and update alarm thresholds as needed")

    def save_report(self, filename: str = None):
        """Save the health check report to a file"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"health_check_report_{self.env}_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.report, f, indent=2, default=str)
        
        print(f"\nReport saved to: {filename}")

    def run_all_checks(self):
        """Run all health checks"""
        print(f"{Colors.BOLD}HFU AI Platform Health Check{Colors.ENDC}")
        print("=" * 60)
        
        # Run all checks
        self.check_ecs_services()
        self.check_load_balancer()
        self.check_lambda_functions()
        self.check_dynamodb_tables()
        self.check_s3_buckets()
        self.check_api_endpoints()
        self.check_cognito()
        self.check_cloudwatch_alarms()
        self.check_secrets_manager()
        self.check_vpc_and_networking()
        
        # Generate summary
        self.generate_summary_report()
        
        return self.report

def main():
    parser = argparse.ArgumentParser(description='HFU AI Platform Health Check')
    parser.add_argument('--env', default='dev', help='Environment name (default: dev)')
    parser.add_argument('--region', default='us-east-1', help='AWS region (default: us-east-1)')
    parser.add_argument('--domain', default='genai.holyfamily.edu', help='Application domain')
    parser.add_argument('--save-report', action='store_true', help='Save report to file')
    parser.add_argument('--output', help='Output filename for report')
    
    args = parser.parse_args()
    
    # Create health checker
    checker = HealthChecker(env=args.env, region=args.region, domain=args.domain)
    
    # Run checks
    report = checker.run_all_checks()
    
    # Save report if requested
    if args.save_report:
        checker.save_report(args.output)

if __name__ == '__main__':
    main()