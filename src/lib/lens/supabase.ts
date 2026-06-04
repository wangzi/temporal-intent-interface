"use client";

// Lens auth — lazy Supabase browser client for journalkit's project.
//
// supabase-js is imported DYNAMICALLY (inside getSupabase), so webpack code-
// splits it into its own chunk and keeps it OUT of the reader's initial bundle.
// It loads only when the author first signs in — anonymous readers (the bulk of
// traffic) never download it. The session's access_token is the Bearer sent to
// journalkit's author-only snapshot create endpoint.

import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient> {
  if (client) return client;
  const { createClient } = await import("@supabase/supabase-js");
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
  return client;
}
