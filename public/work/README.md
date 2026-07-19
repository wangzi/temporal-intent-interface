# Work surface assets

Everything the `/work` cases embed lives here and is served statically from
this origin. Nothing is fetched from a CDN or a third-party host.

## Adding an interactive artifact

Artifacts are self-contained HTML pages — the kind Claude or ChatGPT produces.

1. Drop it at `public/work/artifacts/<id>/index.html`. One directory per
   artifact; relative assets alongside it are fine.
2. Reference it from a case in `src/lib/resume/../work/data.ts`:

   ```ts
   artifacts: [
     {
       src: "/work/artifacts/<id>/index.html",
       title: "What it is",
       description: "One line, also shown to anyone who can't run the frame.",
       height: 520,
     },
   ],
   ```

The schema rejects any other path shape, and rejects remote URLs outright.

### Why self-hosted

Two reasons, both deliberate:

- The Content-Security-Policy keeps `frame-src 'self'`. Pointing a frame at
  `claude.site` would mean trusting an origin whose contents can change or
  vanish without notice.
- The artifact is versioned with the repo, so a case cannot silently break.

### How artifacts are contained

Artifacts run **arbitrary JavaScript from our own origin**, so the CSP does not
contain them — the frame's sandbox does. They are embedded with:

```
sandbox="allow-scripts"
```

and deliberately **not** `allow-same-origin`. That gives the frame an opaque
origin: no access to the host DOM, no cookies, no credentialed same-origin
requests. `httpOnly` prevents a cookie from being _read_ by script, not from
being _sent_, so this matters.

Never add `allow-same-origin` alongside `allow-scripts`. A frame with both can
reach its own frame element and remove the sandbox attribute entirely.

`embed-demo/` demonstrates this: it runs JavaScript, then probes for the host's
cookies, parent DOM, localStorage and a credentialed fetch, and reports each as
blocked. It is a live assertion, not a mock. Delete it once real artifacts land.

## Adding media

Images and video go under `public/work/media/`. Reference them with intrinsic
dimensions and required alt text:

```ts
media: [
  { src: "/work/media/glow-01.jpg", alt: "…", width: 1600, height: 1200 },
],
```

Alt text is required by the schema. A portfolio image nobody can read is a
portfolio image that excludes people.

## Note on size

These are committed to git and deployed with the app. That is fine for a
handful of artifacts and images. If this grows to the point where large
binaries are painful in git history, the upgrade path is Supabase Storage —
already in the stack for Lens — which would need an upload path and therefore
an auth story.
