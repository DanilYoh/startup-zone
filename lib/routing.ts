export function isProtectedPathname(pathname: string) {
  return pathname === "/protected" || pathname.startsWith("/protected/");
}

const authRedirectPaths: ReadonlySet<string> = new Set([
  "/",
  "/protected",
  "/auth/update-password",
]);

export function getSafeAuthRedirectPath(pathname: string | null) {
  return pathname && authRedirectPaths.has(pathname) ? pathname : "/";
}
