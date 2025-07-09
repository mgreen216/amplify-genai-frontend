import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
    // Configure one or more authentication providers
    session: {
        maxAge: 59 * 60
    },
    providers: [
        CredentialsProvider({
            name: "HFU Demo",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "your-email@holyfamily.edu" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                // For demo purposes, accept any @holyfamily.edu email
                if (credentials?.email?.endsWith('@holyfamily.edu')) {
                    return {
                        id: "demo-user",
                        name: credentials.email.split('@')[0],
                        email: credentials.email,
                    }
                }
                return null
            }
        })
    ],
    pages: {
        signIn: '/',
        // signOut: '/auth/signout',
        // error: '/auth/error', // Error code passed in query string as ?error=
        // verifyRequest: '/auth/verify-request', // (used for check email message)
        // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // For credentials provider, create a simple access token
            if (user) {
                token.accessToken = "demo-token-" + Date.now();
                token.accessTokenExpiresAt = Date.now() + (59 * 60 * 1000); // 59 minutes
            }
            return token
        },
        async session({ session, token }) {
            // Send properties to the client
            session.accessToken = token.accessToken
            return session
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
}



export default NextAuth(authOptions)