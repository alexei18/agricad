// src/middleware.ts (Depanare Avansată Token)
import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // ---- LOGGING MAI DETALIAT ----
    console.log(`\n[MW DEBUG] === Request Start ===`);
    console.log(`[MW DEBUG] Pathname: ${pathname}`);
    // Loghează întregul obiect token pentru a vedea structura sa reală
    console.log(`[MW DEBUG] Token Object:`, JSON.stringify(token, null, 2));
    // ---------------------------

    // Redirecționează utilizatorul logat de la pagina de login ('/')
    if (token && pathname === '/') {
      console.log(`[MW DEBUG] Condiție îndeplinită: Există token ȘI calea este /. Încerc redirectare...`);
      // Redirectare simplificată TEMPORAR pentru test
      const redirectUrl = '/mayor/dashboard';
      console.log(`[MW DEBUG] Încerc redirectare către: ${redirectUrl}`);
      return NextResponse.redirect(new URL(redirectUrl, req.url));

      /* --- Cod Original Comentat Temporar ---
      let redirectUrl = '/';
      // Verifică dacă token.role există înainte de a-l accesa
      const userRole = token?.role as string | undefined;
      console.log(`[MW DEBUG] Verific rol pentru redirect: ${userRole}`);
      switch (userRole) {
          case 'admin': redirectUrl = '/admin/dashboard'; break;
          case 'mayor': redirectUrl = '/mayor/dashboard'; break;
          case 'farmer': redirectUrl = '/farmer/dashboard'; break;
          default: console.log(`[MW DEBUG] Rol necunoscut sau lipsă în token: ${userRole}`);
      }
      if (redirectUrl !== '/') {
          console.log(`[MW DEBUG] Redirectez utilizatorul logat de la / către ${redirectUrl}`);
          return NextResponse.redirect(new URL(redirectUrl, req.url));
      } else {
           console.log(`[MW DEBUG] Logat pe /, dar nu s-a găsit dashboard pentru rol: ${userRole}`);
      }
      */
    }

    // Verificare acces bazat pe rol (Presupune că 'token' e validat de 'authorized' callback)
    if (token) {
      const userRole = token?.role as string | undefined;
      console.log(`[MW DEBUG] Verific acces rol pentru: ${pathname}. Rol utilizator: ${userRole}`);
      if (pathname.startsWith('/admin') && userRole !== 'admin') {
        console.log(`[MW DEBUG] Acces refuzat (non-admin). Redirectez la /`);
        return NextResponse.redirect(new URL('/', req.url));
      }
      if (pathname.startsWith('/mayor') && userRole !== 'mayor') {
        console.log(`[MW DEBUG] Acces refuzat (non-mayor). Redirectez la /`);
        return NextResponse.redirect(new URL('/', req.url));
      }
      if (pathname.startsWith('/farmer') && userRole !== 'farmer') {
        console.log(`[MW DEBUG] Acces refuzat (non-farmer). Redirectez la /`);
        return NextResponse.redirect(new URL('/', req.url));
      }
    } else {
      // Ar trebui să fie gestionat de withAuth + authorized, dar ca fallback
      if (pathname.startsWith('/admin') || pathname.startsWith('/mayor') || pathname.startsWith('/farmer')) {
        console.log(`[MW DEBUG] ALARMĂ: Rută protejată accesată fără token! Path: ${pathname}. Redirectez la /`);
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    console.log(`[MW DEBUG] Permit accesul la ${pathname}`);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const isAuth = !!token;
        // Logăm rezultatul și token-ul VĂZUT de acest callback
        console.log(`[MW DEBUG] Authorized Callback Result pentru ${req.nextUrl.pathname}: ${isAuth} (Token: ${JSON.stringify(token, null, 2)})`);
        return isAuth; // Decide dacă rulează funcția middleware principală
      }
    },
    pages: {
      signIn: '/',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Potrivește toate căile de cerere cu excepția celor care încep cu:
     * - api (API routes) - EXCEPȚIE: /api/auth/** este implicit gestionat
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Adăugăm explicit și calea rădăcină '/' pentru siguranță.
     */
    '/', // <-- Adaugă explicit ruta rădăcină
    '/((?!api|_next/static|_next/image|favicon.ico).*)', // Păstrează și regula generală
  ],
};