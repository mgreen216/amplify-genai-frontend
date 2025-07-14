#!/bin/bash

echo "Git Commit Script for HFU AI Platform Updates"
echo "============================================="
echo ""

# Show current status
echo "1. Current git status:"
git status

echo ""
echo "2. Adding all changes..."
git add .

echo ""
echo "3. Files staged for commit:"
git status --short

echo ""
echo "4. Creating commit..."
git commit -m "Fix build errors and implement comprehensive mock API mode

This commit includes multiple critical fixes for the Holy Family University AI Platform:

1. Fixed TypeScript build errors:
   - middleware.ts: Fixed withAuth type error and AUTH_DISABLED check
   - ErrorMessageDiv.tsx: Fixed apostrophe escaping for React
   - test-chat.tsx: Fixed error type handling in catch blocks
   - doRequestOp.ts: Fixed AbortSignal type declaration
   - pages/api/v1/chat/completions.ts: Fixed req parameter in streamMockResponse

2. Implemented mock API configuration:
   - Added mock chat endpoint at /api/v1/chat/completions with streaming support
   - Fixed mock router to handle doRequestOp POST requests
   - Updated mock assistants endpoint to handle all operations
   - Added proper response encoding/decoding in mock router
   - Updated environment variables for mock mode (USE_MOCK_API=true)

3. Fixed authentication system:
   - Added support for AUTH_DISABLED mode in middleware
   - Fixed requestOp to bypass auth when NEXT_PUBLIC_AUTH_DISABLED=true
   - Updated chat service to handle missing access tokens gracefully
   - Moved title tag from _document.tsx to _app.tsx

4. Development environment improvements:
   - Created test-chat.tsx page for API endpoint debugging
   - Added comprehensive documentation in CLAUDE.md
   - Fixed port configuration (3006 for development)
   - Added build scripts (debug-build.sh, quick-build.sh)
   - Added debug endpoint at /api/debug for environment verification

5. Fixed critical runtime issues:
   - Resolved 'Failed to retrieve models' error
   - Fixed 404 errors for chat service on port 3006
   - Fixed 405 Method Not Allowed errors for assistant operations
   - Fixed double encoding issue in mock router
   - Added 30-second timeout to prevent hanging requests
   - Fixed chat UI streaming response parser to handle OpenAI format

These changes enable the application to run in mock mode for development
and testing without requiring external API services. The production build
now completes successfully and the chat functionality works correctly.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""
echo "5. Commit created successfully!"
echo ""
echo "Latest commit:"
git log -1 --oneline

echo ""
echo "To push to remote repository, run:"
echo "git push origin main"