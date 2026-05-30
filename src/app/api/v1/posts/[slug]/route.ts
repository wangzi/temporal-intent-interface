// Thin BFF passthrough for GET /api/v1/posts/{slug}. Reused by
// Phase C clients. Phase B page routes do NOT call this — they call
// engine.getPost() directly server-side.

import {
  EngineError,
  EngineNotFoundError,
  getPost,
} from "@/lib/engine/client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;
  try {
    const data = await getPost(slug);
    return Response.json(data);
  } catch (err) {
    if (err instanceof EngineNotFoundError) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const status = err instanceof EngineError && err.status ? err.status : 502;
    return Response.json(
      { error: "engine_error", message: (err as Error).message },
      { status },
    );
  }
}
