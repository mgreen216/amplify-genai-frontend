# Error Handling & Logging Improvements

## Overview
This document summarizes the error handling and logging improvements made to address model retrieval issues.

## Changes Made

### 1. Enhanced Error Logging in `doRequestOp.ts`
- Added request IDs for tracking individual requests
- Added timing information for performance monitoring
- Enhanced error categorization (NETWORK_ERROR, HTTP_ERROR, CONNECTION_ERROR, etc.)
- Improved error details with request context

### 2. Enhanced Model Fetching in `home.tsx`
- Added fallback models for offline mode
- Implemented model caching in localStorage
- Added detailed error categorization
- Improved error messages based on error type and user permissions
- Added debug logging throughout the fetch process

### 3. Improved Error Display Component (`ErrorMessageDiv.tsx`)
- Dynamic icons based on error type
- Color-coded errors for better visibility
- Retry functionality
- Detailed troubleshooting steps
- Show/hide details option

### 4. Added Error Logging Utility (`errorLogging.ts`)
- Centralized error logging system
- Persistent error storage in localStorage
- Error categorization and filtering
- Export functionality for support
- Debug information collection

### 5. Added Debug Panel (`DebugPanel.tsx`)
- Visual interface for viewing error logs
- Filter errors by type
- Export logs for support
- Clear logs functionality
- System information display

### 6. Added Connection Status Component (`ConnectionStatus.tsx`)
- Real-time connection monitoring
- Visual feedback for connection changes
- Automatic hide after connection restored

### 7. Enhanced API Error Handling (`requestOp.ts`)
- Detailed error logging
- Better error response formatting
- Request timing information

## Usage

### For Users

1. **When Models Fail to Load:**
   - Check the error message for specific instructions
   - Use the retry button to attempt loading again
   - Check connection status indicator

2. **Debug Mode:**
   - Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to open debug panel
   - Or add `?debug=true` to the URL

3. **Offline Mode:**
   - Application automatically switches to offline mode
   - Limited models available
   - Changes sync when connection restored

### For Developers

1. **Error Logging:**
   ```typescript
   import { errorLogger, logModelError } from '@/utils/app/errorLogging';
   
   // Log specific error types
   logModelError('Failed to fetch models', { details });
   
   // Access debug info
   const debugInfo = errorLogger.getDebugInfo();
   ```

2. **Debug Information:**
   - Check browser console for detailed logs
   - Look for prefixed messages: `[fetchModels]`, `[doRequestOp]`, etc.
   - Use debug panel for visual inspection

## Error Types

1. **CONNECTION_ERROR**: Unable to connect to server
2. **NETWORK_ERROR**: General network issues
3. **HTTP_ERROR**: Server returned error status
4. **NO_MODELS_CONFIGURED**: No models available
5. **OFFLINE_MODE**: Working without server connection
6. **MODELS_CACHED**: Using cached models

## Fallback Behavior

1. **Cached Models**: Previously loaded models are stored and reused
2. **Offline Models**: Basic GPT-3.5 Turbo available in offline mode
3. **Error Recovery**: Automatic retry and session recovery

## Support Integration

When users contact support, they can provide:
- Error code from the message
- Exported debug logs
- Screenshots of error messages
- Time of occurrence

This information helps quickly diagnose and resolve issues.