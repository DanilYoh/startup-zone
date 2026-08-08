export function isProtectedPathname(pathname: string) {
  return pathname === "/protected" || pathname.startsWith("/protected/");
}
