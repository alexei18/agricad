
// No middleware needed for routing anymore as i18n is removed.
// If other middleware logic is needed (e.g., auth), it would go here.
// For now, this file can be empty or deleted.

// To keep the file structure clean, we can export a no-op middleware function.
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // No operations needed, just pass through
  return NextResponse.next();
}

// Define which paths the middleware should run on (e.g., all paths)
// Removed the root '/' matcher specifically as it's covered by the general pattern
// and the redirect is no longer needed.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
