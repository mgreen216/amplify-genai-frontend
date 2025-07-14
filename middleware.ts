import { withAuth } from "next-auth/middleware"

// Export the middleware directly from NextAuth
export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Check if auth is disabled at runtime
      const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true'
      
      // If auth is disabled, always authorize
      if (isAuthDisabled) {
        return true
      }
      
      // Otherwise check for valid token
      return !!token
    },
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (all API routes - to prevent blocking API calls)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/signin (signin page)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)",
  ]
};