const PRODUCTION_SITE_URL = "https://hoverboard.arjun-singh.com";

/**
 * The canonical public URL used for Supabase Auth redirects.
 *
 * We deliberately fall back to the production URL instead of window.location.origin
 * so an accidental localhost deployment/test can never bake localhost into a
 * confirmation email for a production account.
 */
export function getAuthSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return PRODUCTION_SITE_URL;
}

export function getAuthCallbackUrl(): string {
  return `${getAuthSiteUrl()}/auth/callback`;
}
