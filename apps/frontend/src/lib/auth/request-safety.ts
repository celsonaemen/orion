import { NextRequest, NextResponse } from "next/server";

import { hasJsonContentTypeHeader, isSameOriginHeaders } from "./request-safety-core";

export function isSameOriginPost(request: NextRequest) {
  return isSameOriginHeaders(request.headers, request.nextUrl.origin);
}

export function hasJsonContentType(request: NextRequest) {
  return hasJsonContentTypeHeader(request.headers);
}

export function unsafeRequestResponse() {
  return NextResponse.json({ message: "Requisicao nao autorizada." }, { status: 403 });
}

export function unsupportedMediaTypeResponse() {
  return NextResponse.json({ message: "Formato de requisicao invalido." }, { status: 415 });
}
