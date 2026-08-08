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
  "/dashboard",
  "/dashboard/profile",
  "/auth/update-password",
]);

export function getSafeAuthRedirectPath(pathname: string | null) {
  if (pathname === "/protected") return "/dashboard";
  return pathname && authRedirectPaths.has(pathname) ? pathname : "/";
}
