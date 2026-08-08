export function isProtectedPathname(pathname: string) {
  return (
    pathname === "/protected" ||
    pathname.startsWith("/protected/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  );
}

const authRedirectPaths: ReadonlySet<string> = new Set([
  "/",
  "/protected",
  "/dashboard/profile",
  "/auth/update-password",
]);

export function getSafeAuthRedirectPath(pathname: string | null) {
  return pathname && authRedirectPaths.has(pathname) ? pathname : "/";
}
