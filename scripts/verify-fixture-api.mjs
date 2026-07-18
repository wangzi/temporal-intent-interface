// Deterministic stand-in for the journalkit snapshot endpoint, so the /s/[token]
// route can be exercised by scripts/verify-ui.mjs without network access or
// credentials. Serves exactly one token and 404s everything else.
//
// Point the app at it with NEXT_PUBLIC_API_URL=http://127.0.0.1:4010.
//
//   node scripts/verify-fixture-api.mjs [port]

import { createServer } from "node:http";

const PORT = Number(process.env.FIXTURE_API_PORT ?? process.argv[2] ?? 4010);
const TOKEN = process.env.SNAPSHOT_TOKEN ?? "audit-token";

const snapshot = {
  title: "Audit snapshot",
  count: 2,
  created_at: "2026-07-18T12:00:00Z",
  entries: [
    {
      id: "audit-1",
      date: "2026-07-17T12:00:00Z",
      title: "First frozen entry",
      body: "Snapshot typography and layout audit.",
      topics: ["audit", "design"],
      people: [],
      type: null,
      importance: null,
    },
    {
      id: "audit-2",
      date: "2026-07-16T12:00:00Z",
      title: "Second frozen entry",
      body: "Responsive snapshot fixture.",
      topics: [],
      people: [],
      type: null,
      importance: null,
    },
  ],
};

createServer((req, res) => {
  if (req.url === `/api/v1/s/${TOKEN}`) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(snapshot));
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
}).listen(PORT, "127.0.0.1", () => {
  console.log(
    `fixture-api listening on http://127.0.0.1:${PORT} (token=${TOKEN})`,
  );
});
