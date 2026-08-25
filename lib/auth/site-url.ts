const PRODUCTION_SITE_URL = "https://hoverboard.arjun-singh.com";

/**
 * HOVERBOARD's canonical public authentication URL.
 *
 * Auth redirects must never inherit a build-time or local-development
 * environment variable. Supabase confirmation emails are production-facing,
 * so this value is intentionally immutable in the client application.
 */
export function getAuthSiteUrl(): string {
  return PRODUCTION_SITE_URL;
}

export function getAuthCallbackUrl(): string {
  return `${PRODUCTION_SITE_URL}/auth/callback`;
}
