// Thin BFF passthrough for GET /api/v1/posts. Reused by Phase C
// clients (selection layer, prefetching). Phase B page routes do NOT
// call this — they call engine.listPosts() directly server-side.

import { listPosts, EngineError } from "@/lib/engine/client";
import type { SortOrder } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sortParam = url.searchParams.get("sort");
  const sort: SortOrder = sortParam === "oldest" ? "oldest" : "newest";
  const filter = url.searchParams.get("filter") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;

  try {
    const data = await listPosts({ sort, filter, cursor });
    return Response.json(data);
  } catch (err) {
    const status = err instanceof EngineError && err.status ? err.status : 502;
    return Response.json(
      { error: "engine_error", message: (err as Error).message },
      { status },
    );
  }
}
