#!/bin/bash

# ========================================
# HFU AI Platform - Docker Deployment Script
# ========================================

set -e

# Configuration
ECR_REPOSITORY="135808927724.dkr.ecr.us-east-1.amazonaws.com/hfu-hfu-amplify-repo"
AWS_REGION="us-east-1"
IMAGE_TAG="${1:-hfu-branded-v3-fixed}"

echo "🚀 Starting HFU AI Platform Docker deployment..."
echo "Repository: $ECR_REPOSITORY"
echo "Tag: $IMAGE_TAG"
echo "Region: $AWS_REGION"

# Step 1: Login to ECR
echo "📝 Logging into AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY

# Step 2: Build the Docker image using optimized Dockerfile
echo "🔨 Building Docker image..."
docker build -f Dockerfile.optimized -t hfu-ai-platform:$IMAGE_TAG .

# Step 3: Tag the image for ECR
echo "🏷️  Tagging image for ECR..."
docker tag hfu-ai-platform:$IMAGE_TAG $ECR_REPOSITORY:$IMAGE_TAG

# Step 4: Push to ECR
echo "📤 Pushing image to ECR..."
docker push $ECR_REPOSITORY:$IMAGE_TAG

# Step 5: Update ECS task definition (if needed)
echo "✅ Image pushed successfully!"
echo "ECR Image URI: $ECR_REPOSITORY:$IMAGE_TAG"
echo ""
echo "📋 Next steps:"
echo "1. Update your ECS task definition with the new image URI"
echo "2. Deploy the updated task definition to your ECS service"
echo "3. Monitor the deployment in ECS console"
echo ""
echo "Environment variables to ensure are set:"
echo "- NEXTAUTH_URL: Your application URL"
echo "- NEXTAUTH_SECRET: Secret for NextAuth.js"
echo "- DISABLE_AUTH: Set to 'true' if you want to disable authentication"

# Optional: Clean up local images
read -p "🧹 Clean up local Docker images? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning up local images..."
    docker rmi hfu-ai-platform:$IMAGE_TAG || true
    docker rmi $ECR_REPOSITORY:$IMAGE_TAG || true
    echo "✅ Cleanup completed!"
fi

echo "🎉 Deployment script completed successfully!"