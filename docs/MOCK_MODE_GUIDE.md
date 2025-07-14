# Mock Mode Guide

This guide explains how to run the Amplify GenAI Frontend application in mock mode, which allows the application to function without backend services.

## Overview

Mock mode provides a fully functional frontend experience with simulated backend responses. This is useful for:
- Development and testing without backend dependencies
- Frontend-only demonstrations
- Troubleshooting frontend issues in isolation
- Quick prototyping and UI development

## Quick Start

1. **Enable Mock Mode**
   ```bash
   cp .env.mock .env.local
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run the Application**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Automatic Fallback
The application automatically falls back to mock mode when:
- No `API_BASE_URL` is configured
- The backend services are unavailable
- `NEXT_PUBLIC_USE_MOCK_API=true` is set in environment variables

### Mock Router
All API requests are intercepted by the mock router (`/pages/api/mock/router.ts`) which:
1. Decodes incoming requests
2. Routes them to appropriate mock handlers
3. Returns realistic mock data
4. Encodes responses using the same format as the real API

### Mock Endpoints

The following endpoints are available in mock mode:

#### Admin Services
- `/available_models` - Returns available AI models
- `/amplifymin/configs` - Admin configurations
- `/amplifymin/feature_flags` - Feature flag settings
- `/amplifymin/user_app_configs` - User-specific configurations
- `/amplifymin/pptx_templates` - PowerPoint templates
- `/amplifymin/amplify_groups/list` - User groups

#### Core Services
- `/state/settings/get` - User settings
- `/state/settings/save` - Save user settings
- `/assistant/*` - Assistant management
- `/state/*` - Application state management
- `/embedding/*` - Document embedding status

## Mock Data

### Default Models
The mock system includes several pre-configured models:
- GPT-3.5 Turbo (default)
- GPT-4 (advanced)
- Claude 3 models (Opus, Sonnet, Haiku)
- Text Embedding Ada

### Feature Flags
All features are enabled by default except:
- Admin Panel (requires specific user/group)
- Code Interpreter (requires developer group)
- Workflows (requires power user group)

### User Configuration
Mock user has standard permissions with:
- Email: user@example.com
- Groups: Users, Standard
- Access to chat, artifacts, assistants, marketplace

## Customization

### Adding New Mock Endpoints

1. Create a new handler in `/pages/api/mock/`:
   ```typescript
   // pages/api/mock/myservice.ts
   import { NextApiRequest, NextApiResponse } from "next";

   const mockMyService = async (req: NextApiRequest, res: NextApiResponse) => {
     // Handle different operations
     const { op } = req.query;
     
     if (req.method === 'GET' && op === 'list') {
       res.status(200).json({
         success: true,
         data: { /* your mock data */ }
       });
     }
   };
   
   export default mockMyService;
   ```

2. Add the route to the mock router:
   ```typescript
   // In pages/api/mock/router.ts
   import mockMyService from "./myservice";
   
   // Add case to switch statement
   case '/myservice/list':
     req.query.op = 'list';
     return mockMyService(req, mockRes);
   ```

### Modifying Mock Data

Edit the mock handlers to return different data:
- Model configurations: `/pages/api/mock/available_models.ts`
- Feature flags: `/pages/api/mock/admin/feature_flags.ts`
- User settings: `/pages/api/mock/settings.ts`

## Testing

### Verify Mock Mode
1. Check browser console for `[Mock Router]` logs
2. Network tab should show requests to `/api/requestOp`
3. Responses should contain encoded mock data

### Common Issues

**Issue: "Unauthorized" error**
- Solution: Mock mode still requires authentication. Use the demo login or configure NextAuth.

**Issue: Features not appearing**
- Solution: Check feature flags in `/pages/api/mock/admin/feature_flags.ts`
- Verify user groups in `/pages/api/mock/admin/user_app_configs.ts`

**Issue: Models not loading**
- Solution: Ensure `/pages/api/mock/available_models.ts` returns valid model data
- Check browser console for errors

## Production Considerations

⚠️ **Warning**: Mock mode is for development only. Never use in production.

To disable mock mode:
1. Remove or rename `.env.local`
2. Set `NEXT_PUBLIC_USE_MOCK_API=false`
3. Configure real `API_BASE_URL`

## Advanced Features

### Simulating Errors
Add error simulation to test error handling:
```typescript
if (Math.random() < 0.1) { // 10% error rate
  res.status(500).json({ error: "Simulated error" });
  return;
}
```

### Delayed Responses
Simulate network latency:
```typescript
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
```

### Dynamic Mock Data
Generate realistic data using libraries like Faker.js:
```typescript
import { faker } from '@faker-js/faker';

const mockUser = {
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email()
};
```

## Troubleshooting

### Debug Mode
Enable detailed logging:
```javascript
// In requestOp.ts
console.log('[requestOp] Request details:', {
  path: reqData.path,
  op: reqData.op,
  method: method,
  payload: payload
});
```

### Reset Mock Data
Clear browser storage to reset:
```javascript
localStorage.clear();
sessionStorage.clear();
```

## Contributing

When adding new features:
1. Create corresponding mock endpoints
2. Document mock data structure
3. Update this guide with new endpoints
4. Test both mock and real modes

## Summary

Mock mode provides a complete frontend experience without backend dependencies. It's ideal for:
- Rapid frontend development
- UI/UX testing
- Demonstrations
- Troubleshooting

Remember to always test with real backend services before deploying to production.