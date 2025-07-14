# Holy Family University AI Platform - Claude Development Documentation

## Project Overview
This is the Holy Family University AI Platform, an educational AI chat interface built with Next.js and deployed on AWS ECS Fargate. The platform provides AI-powered assistance to students and faculty while maintaining FERPA compliance for educational data.

## Recent Development History

### Critical Issues Resolved (Session Date: 2025-07-11)

#### 1. Authentication System Failure
**Problem**: Login button would not display credentials form - clicking "login" just reloaded the page.
**Root Cause**: NextAuth.js configuration had `signIn: '/'` redirecting to home page instead of credentials form.
**Solution**: 
- Fixed NextAuth config to use `signIn: '/auth/signin'`
- Created custom signin page at `/pages/auth/signin.tsx`
- Re-enabled authentication middleware that was disabled for "demo purposes"

#### 2. Docker Deployment Issues 
**Problem**: Application returned "You've reached the end" for all requests instead of serving the UI.
**Root Cause**: Dockerfile not properly configured for Next.js standalone output mode.
**Solution**: Updated Dockerfile to use `.next/standalone` build output and `node server.js` startup command.

#### 3. Security Vulnerabilities
**Problem**: Multiple critical security issues identified including disabled authentication.
**Solution**: Re-enabled authentication, improved session management, added proper middleware protection.

#### 4. Mock API Mode Implementation
**Problem**: Failed to retrieve models error when loading application - mock mode not properly configured.
**Root Cause**: Environment variables missing, API_BASE_URL set to placeholder value, mock endpoints not handling doRequestOp POST requests.
**Solution**:
- Fixed environment variables (USE_MOCK_API=true, NEXT_PUBLIC_USE_MOCK_API=true)
- Corrected API_BASE_URL to use localhost:3000
- Added timeout configuration (30 seconds) to prevent hanging requests
- Fixed encoding/decoding issues in mock router

#### 5. Chat Service Unavailable (404 Error)
**Problem**: Chat service returned 404 on port 3006, middleware blocking API routes despite AUTH_DISABLED=true.
**Root Cause**: 
- CHAT_ENDPOINT missing NEXT_PUBLIC_ prefix for client-side access
- Middleware blocking all API routes including mock endpoints
- Dev server running on port 3006 vs expected 3000
- No CORS configuration for API endpoints
**Solution**:
- Added NEXT_PUBLIC_CHAT_ENDPOINT with full URL
- Updated middleware to respect AUTH_DISABLED flag
- Fixed URL construction in chatService.ts
- Added CORS support via configureCORS utility
- Created comprehensive mock chat endpoint at /api/v1/chat/completions

#### 6. Assistant List 405 Error
**Problem**: Assistant list endpoint returning 405 Method Not Allowed when accessed via doRequestOp.
**Root Cause**: Mock assistants handler checking for specific HTTP methods (GET, PUT, DELETE) but doRequestOp always sends POST requests.
**Solution**: Updated assistants mock handler to check operation type (`op` parameter) instead of HTTP method since all requests come as POST.

## Architecture

### Frontend Stack
- **Framework**: Next.js 14.2.4 with TypeScript
- **Authentication**: NextAuth.js v4.24.5 with Credentials Provider
- **Styling**: Tailwind CSS with dark mode support
- **UI Components**: Custom components + @mantine/core
- **State Management**: React Context API

### Deployment Infrastructure
- **Container**: Docker multi-stage build on Alpine Linux
- **Registry**: AWS ECR (135808927724.dkr.ecr.us-east-1.amazonaws.com/hfu-hfu-amplify-repo)
- **Compute**: AWS ECS Fargate 
- **Load Balancer**: AWS Application Load Balancer with SSL/TLS
- **Domain**: https://hfu-genai-alb-501693461.us-east-1.elb.amazonaws.com

### Backend Services
- **API Gateway**: AWS API Gateway for backend routing
- **Functions**: AWS Lambda for chat and AI processing
- **Database**: DynamoDB for data storage
- **Security**: KMS for encryption, IAM for access control

## Development Commands

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
```

### Docker Commands
```bash
# Build new image
docker build --platform linux/amd64 -t hfu-genai-frontend .

# Tag for ECR
docker tag hfu-genai-frontend:latest 135808927724.dkr.ecr.us-east-1.amazonaws.com/hfu-hfu-amplify-repo:latest

# Push to ECR (requires AWS CLI authentication)
docker push 135808927724.dkr.ecr.us-east-1.amazonaws.com/hfu-hfu-amplify-repo:latest
```

### ECS Deployment
```bash
# Update ECS service (requires AWS CLI)
aws ecs update-service --cluster hfu-genai-cluster --service hfu-genai-service --force-new-deployment
```

## Environment Variables

### Required Environment Variables
```bash
NEXTAUTH_URL=https://hfu-genai-alb-501693461.us-east-1.elb.amazonaws.com
NEXTAUTH_SECRET=hfu-demo-secret-key-12345
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
```

### Authentication Configuration
- **Provider**: Credentials provider for @holyfamily.edu emails
- **Session Duration**: 59 minutes
- **Demo Mode**: Currently accepts any @holyfamily.edu email with any password

## File Structure

### Key Directories
```
/pages/
  /api/auth/          # NextAuth.js authentication endpoints
  /auth/signin.tsx    # Custom signin page
  /home/              # Main application pages
  /assistants/        # AI assistant interfaces

/components/          # Reusable UI components
/lib/                 # Core libraries and contexts
/services/            # API service layers
/hooks/               # Custom React hooks
/utils/               # Utility functions
/types/               # TypeScript type definitions
/styles/              # CSS and styling files
```

### Critical Files
- `middleware.ts` - Authentication middleware
- `Dockerfile` - Container build configuration
- `next.config.js` - Next.js configuration with standalone output
- `package.json` - Dependencies and scripts
- `CLAUDE.md` - This documentation file

## Authentication Flow

1. User accesses protected route
2. Middleware checks for valid session
3. If no session, redirects to `/auth/signin`
4. User enters @holyfamily.edu email and password
5. Credentials provider validates email domain
6. Session created and user redirected to requested page

## Security Considerations

### Current Security Posture
- ✅ Authentication re-enabled with proper middleware
- ✅ HTTPS/SSL configured through ALB
- ✅ Non-root user in Docker container
- ✅ Input validation on authentication
- ⚠️ Demo credentials provider (not production-ready)
- ⚠️ Session tokens use timestamp-based generation
- ❌ No rate limiting implemented
- ❌ FERPA compliance gaps remain

### FERPA Compliance Requirements
- **Audit Logging**: Not yet implemented
- **Data Encryption**: Basic HTTPS only
- **Access Controls**: Limited to email domain validation
- **Data Retention**: No policies implemented
- **Breach Response**: No automated procedures

## Known Issues & Limitations

### Current Limitations
1. **Demo Authentication**: Currently accepts any @holyfamily.edu email
2. **No Azure AD Integration**: IT department couldn't provide metadata
3. **Limited Session Security**: Predictable token generation
4. **No Audit Logging**: FERPA compliance gap
5. **No Rate Limiting**: Vulnerable to abuse

### Planned Improvements
1. **Production Authentication**: Integrate with university systems
2. **Enhanced Security**: Implement rate limiting and better session management
3. **FERPA Compliance**: Add comprehensive audit logging
4. **Monitoring**: Implement health checks and alerting
5. **Performance**: Add caching and optimization

## Troubleshooting

### Common Issues

#### "You've reached the end" Response
- **Cause**: Docker build not using standalone output correctly
- **Solution**: Rebuild Docker image with updated Dockerfile

#### Login Button Not Working
- **Cause**: NextAuth configuration redirecting to wrong page
- **Solution**: Verify `/auth/signin` page exists and NextAuth config is correct

#### Authentication Loops
- **Cause**: Middleware configuration issues
- **Solution**: Check middleware.ts matcher patterns

#### Container Won't Start
- **Cause**: Missing files in Docker image or wrong startup command
- **Solution**: Verify standalone build includes all necessary files

## Development Guidelines

### Git Workflow
1. Create feature branch from `main`
2. Make changes and test locally
3. Commit changes with descriptive messages
4. Push to remote branch
5. Create pull request for review
6. Merge to main after approval

### Code Standards
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Document security-relevant changes
- Update this CLAUDE.md file for major changes

### Security Guidelines
- Never commit secrets or credentials
- Validate all user inputs
- Use parameterized queries
- Implement proper error handling
- Follow FERPA guidelines for educational data

## Deployment Checklist

### Pre-Deployment
- [ ] Run `npm run build` successfully
- [ ] Run `npm run lint` with no errors
- [ ] Test authentication flow locally
- [ ] Verify environment variables
- [ ] Update version in package.json

### Docker Build
- [ ] Build image with `docker build --platform linux/amd64`
- [ ] Test container locally
- [ ] Tag with appropriate version
- [ ] Push to ECR repository

### ECS Deployment
- [ ] Update task definition if needed
- [ ] Deploy new service version
- [ ] Verify health checks pass
- [ ] Test authentication in production
- [ ] Monitor logs for errors

## Support & Contact

### Technical Support
- **Platform**: Holy Family University AI Platform
- **Repository**: Originally from https://github.com/gaiin-platform
- **Current Location**: /Users/mgreen2/code/hfu-genai/amplify-genai-frontend
- **Documentation**: This CLAUDE.md file

### Development History
This platform has been developed with assistance from Claude AI to address critical authentication and deployment issues for educational use at Holy Family University.

---
*Last Updated: 2025-07-11*
*Developer: AI-Assisted Development with Claude*