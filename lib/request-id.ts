const requestIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/;

export function requestIdFromHeaders(headers: Headers) {
  const incoming = headers.get("x-request-id");
  return incoming && requestIdPattern.test(incoming) ? incoming : crypto.randomUUID();
}
