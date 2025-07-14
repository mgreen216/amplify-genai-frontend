# Debugging Model Retrieval Errors

This guide helps you troubleshoot issues when models fail to load in the application.

## Common Error Types

### 1. Connection Errors
**Symptoms:**
- "Unable to connect to server" message
- Orange/yellow warning icon
- Working in offline mode

**Troubleshooting Steps:**
1. Check your internet connection
2. Try disabling VPN if you're using one
3. Check if your firewall is blocking the connection
4. Verify the API endpoint is accessible

### 2. No Models Configured
**Symptoms:**
- "No models are currently configured" message
- Blue settings icon

**Troubleshooting Steps:**
- **For Administrators:**
  1. Click the gear icon in the left sidebar
  2. Select "Admin Interface"
  3. Navigate to the "Supported Models" tab
  4. Enable the models you want to use
  
- **For Regular Users:**
  - Contact your administrator to configure models

### 3. Authentication Errors
**Symptoms:**
- "Your session may have expired" message
- Status code 401

**Troubleshooting Steps:**
1. Refresh the page
2. Log out and log back in
3. Clear browser cookies for this site

### 4. Server Errors
**Symptoms:**
- "The server is experiencing issues" message
- Status code 500 or higher

**Troubleshooting Steps:**
1. Wait a few minutes and try again
2. Check the service status page (if available)
3. Contact support if the issue persists

## Using the Debug Panel

The application includes a debug panel for advanced troubleshooting:

### Accessing the Debug Panel
1. Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) anywhere in the app
2. Or append `?debug=true` to the URL

### Debug Panel Features
- **Error Logs**: View all logged errors with timestamps
- **Filter**: Filter errors by type
- **Export**: Download error logs as JSON
- **System Info**: View connection status and browser info

### Information to Provide to Support

When contacting support, please provide:
1. **Error Code**: Displayed in the error message
2. **Error ID**: If available (e.g., `Error ID: abc123`)
3. **Steps to Reproduce**: What you were doing when the error occurred
4. **Debug Logs**: Export from the debug panel
5. **Browser Info**: Browser name and version
6. **Time of Error**: When the issue occurred

## Offline Mode

When the application can't connect to the server, it automatically switches to offline mode:

- Limited models are available (GPT-3.5 Turbo)
- Conversations are saved locally
- Changes will sync when connection is restored
- Some features may be unavailable

## Browser Console

For developers and advanced users, additional debugging information is available in the browser console:

1. Open Developer Tools (F12)
2. Go to the Console tab
3. Look for messages prefixed with:
   - `[fetchModels]` - Model loading logs
   - `[doRequestOp]` - API request logs
   - `[requestOp]` - Server communication logs

## Common Solutions

### Clear Cache and Reload
1. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Clear site data in browser settings

### Check LocalStorage
Models are cached in browser storage. To clear:
1. Open Developer Tools
2. Go to Application/Storage tab
3. Clear Local Storage for this site

### Verify API Access
Test if you can access the API directly:
```bash
curl -X GET https://[your-api-endpoint]/available_models \
  -H "Authorization: Bearer [your-token]"
```

## Error Recovery

The application includes several recovery mechanisms:

1. **Automatic Retry**: Failed requests are retried automatically
2. **Cached Models**: Previously loaded models are cached
3. **Fallback Models**: Basic models available in offline mode
4. **Session Recovery**: Automatic re-authentication on session expiry

## Need More Help?

If you continue to experience issues:

1. Export debug logs using the debug panel
2. Take a screenshot of the error message
3. Note the exact time the error occurred
4. Contact support with this information

Support Email: [Set in Admin Interface]