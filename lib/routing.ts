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

const startupSignInRedirectPattern = /^\/startups\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

export function getSafeSignInRedirectPath(pathname: string | null) {
  if (!pathname) return "/dashboard";

  const match = startupSignInRedirectPattern.exec(pathname);
  return match?.[1] && match[1].length <= 60 ? pathname : "/dashboard";
}
