const blockedHostnameSuffixes = [
  "localhost",
  ".localhost",
  ".local",
  ".internal",
  ".home.arpa",
];

const pitchDeckProviders = new Set([
  "docsend.com",
  "docs.google.com",
  "drive.google.com",
  "pitch.com",
  "www.docsend.com",
  "www.pitch.com",
]);

function isIpv4Address(hostname: string) {
  const octets = hostname.split(".").map(Number);
  return !(
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  );
}

export function parsePublicHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443") ||
      !hostname.includes(".") ||
      hostname.includes(":") ||
      blockedHostnameSuffixes.some(
        (suffix) => hostname === suffix || hostname.endsWith(suffix),
      ) ||
      isIpv4Address(hostname)
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export function isPublicHttpsUrl(value: string) {
  return parsePublicHttpsUrl(value) !== null;
}

export function isPitchDeckUrl(value: string) {
  const url = parsePublicHttpsUrl(value);
  if (!url) return false;

  return (
    url.pathname.toLowerCase().endsWith(".pdf") ||
    pitchDeckProviders.has(url.hostname.toLowerCase())
  );
}

export function externalHostname(value: string) {
  return parsePublicHttpsUrl(value)?.hostname ?? "внешний сайт";
}
