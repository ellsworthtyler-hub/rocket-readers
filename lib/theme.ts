// Paths that use the calmer parent/teacher UI (About, Premium, Login).
// Everything else defaults to Cosmic (playful discovery).

export const CALM_PATH_PREFIXES = ['/about', '/premium', '/login'] as const;

export function isCalmPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return CALM_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
