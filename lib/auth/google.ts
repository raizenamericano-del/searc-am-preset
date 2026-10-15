import "server-only";

/**
 * Google sign-in is intentionally NOT bundled: every user feature
 * (bookmarks, history) is device-local, so no account is required.
 *
 * To add it later, implement OAuth (e.g. Auth.js with the Google provider)
 * behind this function and return "enabled" only once a real session
 * flow exists. Never collect Google passwords directly.
 */
export function getGoogleAuthStatus(): "enabled" | "not_configured" {
  return "not_configured";
}
