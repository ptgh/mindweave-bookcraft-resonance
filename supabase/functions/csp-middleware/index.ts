import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://ai.gateway.lovable.dev https://www.google-analytics.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = {
  "Content-Security-Policy": CSP_POLICY,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

const CACHE_HEADERS = {
  // Cache static assets for 1 year
  "Cache-Control": "public, max-age=31536000, immutable",
};

serve(async (req) => {
  const url = new URL(req.url);
  
  // Determine if this is a static asset
  const isStaticAsset = /\.(js|css|jpg|jpeg|png|gif|webp|svg|woff|woff2|ttf|ico)$/i.test(url.pathname);
  
  // Determine if this is an API route
  const isApiRoute = url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/');
  
  const headers = new Headers({
    ...SECURITY_HEADERS,
    ...(isStaticAsset ? CACHE_HEADERS : {}),
    ...(isApiRoute ? { "Cache-Control": "no-store, must-revalidate" } : {}),
  });
  
  return new Response(
    JSON.stringify({
      message: "CSP middleware - use these headers in your web server configuration",
      headers: Object.fromEntries(headers),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(headers),
      },
    }
  );
});
