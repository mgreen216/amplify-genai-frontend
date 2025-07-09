// Temporarily disable auth middleware for demo
export default function middleware() {
  // Allow all requests for demo purposes
  return;
}

export const config = {
  matcher: []
}; 