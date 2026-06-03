"use client";

// Lens auth — Supabase browser client for journalkit's project. Lazy so it's
// only constructed in the browser (effects / handlers), never during SSR or
// prerender (where NEXT_PUBLIC_* may be absent). The session's access_token is
// the JWT sent as a Bearer to journalkit's author-only snapshot endpoints.
//
// This is the ONLY user-auth surface in TII. The public reader body + post
// pages remain unauthenticated and server-rendered.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
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
