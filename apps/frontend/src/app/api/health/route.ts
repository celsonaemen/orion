import { getBackendBaseUrl } from "@/lib/config/backend-url";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backendResponse = await fetch(`${getBackendBaseUrl()}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });

    if (!backendResponse.ok) throw new Error("Backend health check failed.");

    return Response.json({
      backend: "connected",
      service: "orion-frontend",
      status: "ok",
    });
  } catch {
    return Response.json(
      {
        backend: "unavailable",
        service: "orion-frontend",
        status: "error",
      },
      { status: 503 },
    );
  }
}
