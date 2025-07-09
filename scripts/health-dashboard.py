#!/usr/bin/env python3

"""
HFU AI Platform Health Dashboard
Provides a real-time dashboard view of the platform health status
"""

import boto3
import time
import os
import sys
from datetime import datetime
from typing import Dict, Any
import requests
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.layout import Layout
from rich.live import Live
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.text import Text

class HealthDashboard:
    def __init__(self, env: str = 'dev', region: str = 'us-east-1'):
        self.env = env
        self.region = region
        self.console = Console()
        
        # Initialize AWS clients
        self.ecs = boto3.client('ecs', region_name=region)
        self.elbv2 = boto3.client('elbv2', region_name=region)
        self.lambda_client = boto3.client('lambda', region_name=region)
        self.dynamodb = boto3.client('dynamodb', region_name=region)
        self.cloudwatch = boto3.client('cloudwatch', region_name=region)
        
    def get_status_icon(self, status: str) -> str:
        """Get status icon with color"""
        icons = {
            'healthy': '[green]✓[/green]',
            'warning': '[yellow]⚠[/yellow]',
            'error': '[red]✗[/red]',
            'unknown': '[dim]?[/dim]'
        }
        return icons.get(status.lower(), icons['unknown'])
    
    def check_ecs_status(self) -> Dict[str, Any]:
        """Quick ECS status check"""
        try:
            cluster_name = f"{self.env}-amplify-cluster"
            service_name = f"{self.env}-amplify-service"
            
            clusters = self.ecs.describe_clusters(clusters=[cluster_name])
            if clusters['clusters']:
                cluster = clusters['clusters'][0]
                
                services = self.ecs.describe_services(
                    cluster=cluster_name,
                    services=[service_name]
                )
                
                if services['services']:
                    service = services['services'][0]
                    
                    status = 'healthy' if service['runningCount'] == service['desiredCount'] else 'warning'
                    
                    return {
                        'status': status,
                        'running': service['runningCount'],
                        'desired': service['desiredCount'],
                        'pending': service['pendingCount']
                    }
            
            return {'status': 'error', 'message': 'Service not found'}
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def check_alb_status(self) -> Dict[str, Any]:
        """Quick ALB status check"""
        try:
            alb_name = f"{self.env}-amplify-alb"
            
            lbs = self.elbv2.describe_load_balancers()
            for lb in lbs['LoadBalancers']:
                if lb['LoadBalancerName'] == alb_name:
                    
                    # Get target groups
                    tgs = self.elbv2.describe_target_groups(
                        LoadBalancerArn=lb['LoadBalancerArn']
                    )
                    
                    healthy_targets = 0
                    total_targets = 0
                    
                    for tg in tgs['TargetGroups']:
                        health = self.elbv2.describe_target_health(
                            TargetGroupArn=tg['TargetGroupArn']
                        )
                        
                        for target in health['TargetHealthDescriptions']:
                            total_targets += 1
                            if target['TargetHealth']['State'] == 'healthy':
                                healthy_targets += 1
                    
                    status = 'healthy' if healthy_targets == total_targets and total_targets > 0 else 'warning'
                    
                    return {
                        'status': status,
                        'state': lb['State']['Code'],
                        'healthy_targets': healthy_targets,
                        'total_targets': total_targets
                    }
            
            return {'status': 'error', 'message': 'ALB not found'}
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def check_lambda_status(self) -> Dict[str, Any]:
        """Quick Lambda status check"""
        try:
            functions = self.lambda_client.list_functions()
            
            env_functions = [f for f in functions['Functions'] 
                           if f['FunctionName'].startswith(f"{self.env}-")]
            
            active_count = sum(1 for f in env_functions if f.get('State') == 'Active')
            total_count = len(env_functions)
            
            status = 'healthy' if active_count == total_count else 'warning'
            
            return {
                'status': status,
                'active': active_count,
                'total': total_count
            }
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def check_alarms_status(self) -> Dict[str, Any]:
        """Quick CloudWatch alarms check"""
        try:
            alarms = self.cloudwatch.describe_alarms()
            
            env_alarms = [a for a in alarms['MetricAlarms'] 
                         if self.env in a.get('AlarmName', '')]
            
            alarm_count = sum(1 for a in env_alarms if a['StateValue'] == 'ALARM')
            total_count = len(env_alarms)
            
            status = 'healthy' if alarm_count == 0 else 'error'
            
            return {
                'status': status,
                'alarms': alarm_count,
                'total': total_count
            }
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def check_endpoint_status(self) -> Dict[str, Any]:
        """Quick endpoint check"""
        try:
            domain = 'genai.holyfamily.edu'
            response = requests.get(f'https://{domain}', timeout=5)
            
            status = 'healthy' if response.status_code == 200 else 'warning'
            
            return {
                'status': status,
                'code': response.status_code,
                'time_ms': int(response.elapsed.total_seconds() * 1000)
            }
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def create_status_table(self) -> Table:
        """Create the main status table"""
        table = Table(title=f"HFU AI Platform Health Status - {self.env.upper()}")
        
        table.add_column("Component", style="cyan", no_wrap=True)
        table.add_column("Status", justify="center")
        table.add_column("Details", style="dim")
        
        # Check each component
        checks = [
            ("ECS Service", self.check_ecs_status()),
            ("Load Balancer", self.check_alb_status()),
            ("Lambda Functions", self.check_lambda_status()),
            ("CloudWatch Alarms", self.check_alarms_status()),
            ("Web Endpoint", self.check_endpoint_status())
        ]
        
        for component, result in checks:
            status_icon = self.get_status_icon(result['status'])
            
            if result['status'] == 'error':
                details = result.get('message', 'Check failed')
            else:
                # Format details based on component
                if component == "ECS Service":
                    details = f"Running: {result.get('running', 0)}/{result.get('desired', 0)}"
                elif component == "Load Balancer":
                    details = f"Healthy: {result.get('healthy_targets', 0)}/{result.get('total_targets', 0)}"
                elif component == "Lambda Functions":
                    details = f"Active: {result.get('active', 0)}/{result.get('total', 0)}"
                elif component == "CloudWatch Alarms":
                    details = f"In Alarm: {result.get('alarms', 0)}/{result.get('total', 0)}"
                elif component == "Web Endpoint":
                    details = f"HTTP {result.get('code', 0)} ({result.get('time_ms', 0)}ms)"
                else:
                    details = "OK"
            
            table.add_row(component, status_icon, details)
        
        return table
    
    def create_info_panel(self) -> Panel:
        """Create the info panel"""
        info_text = f"""
[bold]Environment:[/bold] {self.env}
[bold]Region:[/bold] {self.region}
[bold]Last Update:[/bold] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

[dim]Press Ctrl+C to exit[/dim]
        """
        
        return Panel(info_text.strip(), title="Dashboard Info", border_style="blue")
    
    def create_legend_panel(self) -> Panel:
        """Create the legend panel"""
        legend_text = """
[green]✓[/green] Healthy - Component functioning normally
[yellow]⚠[/yellow] Warning - Component needs attention
[red]✗[/red] Error - Component has critical issues
[dim]?[/dim] Unknown - Unable to determine status
        """
        
        return Panel(legend_text.strip(), title="Status Legend", border_style="dim")
    
    def run_dashboard(self, refresh_interval: int = 30):
        """Run the dashboard with auto-refresh"""
        layout = Layout()
        
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="main", size=15),
            Layout(name="footer")
        )
        
        layout["footer"].split_row(
            Layout(name="info"),
            Layout(name="legend")
        )
        
        with Live(layout, refresh_per_second=1, screen=True) as live:
            while True:
                try:
                    # Update header
                    header_text = Text()
                    header_text.append("HFU AI Platform Health Dashboard\n", style="bold blue")
                    header_text.append(f"Auto-refresh every {refresh_interval} seconds", style="dim")
                    layout["header"].update(Panel(header_text, box=None))
                    
                    # Update main content
                    with Progress(
                        SpinnerColumn(),
                        TextColumn("[progress.description]{task.description}"),
                        transient=True
                    ) as progress:
                        task = progress.add_task("Checking health status...", total=None)
                        layout["main"].update(self.create_status_table())
                        progress.remove_task(task)
                    
                    # Update footer
                    layout["info"].update(self.create_info_panel())
                    layout["legend"].update(self.create_legend_panel())
                    
                    # Wait for refresh interval
                    time.sleep(refresh_interval)
                    
                except KeyboardInterrupt:
                    break
                except Exception as e:
                    layout["main"].update(
                        Panel(f"[red]Error updating dashboard: {str(e)}[/red]", 
                              title="Error", border_style="red")
                    )
                    time.sleep(5)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='HFU AI Platform Health Dashboard')
    parser.add_argument('--env', default='dev', help='Environment name (default: dev)')
    parser.add_argument('--region', default='us-east-1', help='AWS region (default: us-east-1)')
    parser.add_argument('--refresh', type=int, default=30, help='Refresh interval in seconds (default: 30)')
    
    args = parser.parse_args()
    
    dashboard = HealthDashboard(env=args.env, region=args.region)
    
    try:
        dashboard.run_dashboard(refresh_interval=args.refresh)
    except KeyboardInterrupt:
        print("\nDashboard stopped.")
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()