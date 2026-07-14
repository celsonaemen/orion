import { NextRequest, NextResponse } from "next/server";

import { validateLoginFields } from "@/features/auth/validation";
import { loginWithBackend } from "@/lib/auth/backend";
import { setAuthCookies } from "@/lib/auth/cookies";
import {
  hasJsonContentType,
  isSameOriginPost,
  unsafeRequestResponse,
  unsupportedMediaTypeResponse,
} from "@/lib/auth/request-safety";

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return unsafeRequestResponse();
  }

  if (!hasJsonContentType(request)) {
    return unsupportedMediaTypeResponse();
  }

  const body = await request.json().catch(() => null);
  const validation = validateLoginFields({
    email: typeof body === "object" && body !== null && "email" in body ? body.email : "",
    password:
      typeof body === "object" && body !== null && "password" in body ? body.password : "",
  });

  if (!validation.isValid) {
    return NextResponse.json(
      {
        errors: validation.errors,
        message: "Revise os dados informados.",
      },
      { status: 400 },
    );
  }

  const result = await loginWithBackend(validation.values);

  if (!result.ok) {
    return NextResponse.json(
      {
        message:
          result.status === 401
            ? "E-mail ou senha invalidos."
            : "Nao foi possivel acessar o Orion agora.",
      },
      { status: result.status === 401 ? 401 : 503 },
    );
  }

  const response = NextResponse.json({
    user: result.data.user,
  });
  setAuthCookies(response, result.data.tokens);

  return response;
}
