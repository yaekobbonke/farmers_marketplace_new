// D:\myapps\farmers-marketplace\frontend\middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get user from cookies
  const userStr = request.cookies.get('user')?.value;
  
  // Check if trying to access admin routes
  if (pathname.startsWith('/admin')) {
    if (!userStr) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role?.toUpperCase() !== 'ADMIN') {
        // Redirect non-admins to their dashboard
        if (user.role?.toUpperCase() === 'FARMER') {
          return NextResponse.redirect(new URL('/farmer/dashboard', request.url));
        } else if (user.role?.toUpperCase() === 'BUYER') {
          return NextResponse.redirect(new URL('/buyer/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};