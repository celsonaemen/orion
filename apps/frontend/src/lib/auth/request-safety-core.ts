export function isSameOriginHeaders(headers: Headers, requestOrigin: string) {
  const origin = headers.get("origin");
  const fetchSite = headers.get("sec-fetch-site");

  if (origin && origin !== requestOrigin) {
    return false;
  }

  if (fetchSite === "cross-site") {
    return false;
  }

  return true;
}

export function hasJsonContentTypeHeader(headers: Headers) {
  const contentType = headers.get("content-type");
  return typeof contentType === "string" && contentType.toLowerCase().includes("application/json");
}
