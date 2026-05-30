# Zipglancer

A standalone, client-side web app for exploring ZIP and OME-Zarr archives on the web.

## What it does

- Opens any `.zip` or `.ozx` (RFC-9 OZX) archive accessible via a public URL — no server-side extraction needed.
- Lists all archive entries with sizes and compression ratios.
- Detects Zarr v2 and v3 hierarchies (root or nested) inside the archive.
- Reads RFC-9 OZX metadata from the ZIP archive comment (`jsonFirst` optimization).
- Reads OME-Zarr multiscales metadata (channels, axes, scales) for root-level Zarr stores.
- Generates a Neuroglancer link using the pipe-chained source format:
  ```
  ARCHIVE_URL|zip:INNER_PATH/|zarr3:
  ```
- Previews JSON/text entries inline (`.zattrs`, `zarr.json`, `.zgroup`, etc.).

All processing is done in the browser via HTTP range requests — the archive is never fully downloaded.

## Architecture

```
?url=<data link to .zip/.ozx>  ──► zipglancer SPA
       │
       ├─ @zip.js/zip.js HttpRangeReader  → list entries + read ZIP comment
       ├─ RFC-9 OZX comment parser        → detect jsonFirst optimization
       ├─ Zarr root detector              → find zarr.json / .zattrs roots
       ├─ @zarrita/storage ZipFileStore   → read OME-Zarr metadata lazily
       └─ Neuroglancer URL builder        → "URL|zip:root/|zarr3:" + state JSON
```

## Integration with Fileglancer

[Fileglancer](https://github.com/JaneliaSciComp/fileglancer) is a web application
for browsing, sharing, and managing scientific imaging data. It produces
range-capable data links via its `/api/content/` endpoint that zipglancer can open
directly. Pass the data link as the `url` query parameter:

```
https://zipglancer.example.org/?url=https://fileglancer.example.org/api/content/myFsp/data.ozx
```

## Deployment

### Standalone (hosted separately)

```bash
npm install
npm run build    # outputs to dist/
```

Serve `dist/` with any static file server. Note: if zipglancer is on a different
origin than the data server, the data server must send CORS headers that allow
cross-origin range reads:

```
Access-Control-Allow-Origin: https://zipglancer.example.org
Access-Control-Allow-Headers: Range
Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges
```

### Co-served by Fileglancer at `/zipglancer/`

```bash
ZIPGLANCER_BASE=/zipglancer/ npm run build
```

Then serve `dist/` from the fileglancer backend at `/zipglancer/`. No CORS needed
(same origin as the data links).

## Development

```bash
npm install
npm run dev          # Vite dev server at http://localhost:5173
npm test             # Vitest unit tests (20 tests)
npm run typecheck    # TypeScript type check
npm run lint         # ESLint
npm run format       # Prettier
```

## Tech stack

Matches the fileglancer frontend stack for visual consistency:

- Vite 6 + React 18 + TypeScript 5.8
- Tailwind CSS 3 + Material Tailwind v3 (HHMI teal theme)
- TanStack Query v5
- `@zip.js/zip.js` — HTTP range-capable ZIP reader
- `@zarrita/storage` — ZipFileStore (lazy zarr-in-zip reader)
- `ome-zarr.js` — OME-Zarr multiscales metadata
- Vitest + React Testing Library

## RFC-9 OZX format

[OME-Zarr RFC 9](https://github.com/ome/ngff/pull/…) defines an optimized ZIP
container for OME-Zarr v0.5 (Zarr v3). Zipglancer reads the RFC-9 metadata from
the ZIP archive comment:

```json
{
  "ome": {
    "version": "0.5",
    "zipFile": {
      "centralDirectory": {
        "jsonFirst": true
      }
    }
  }
}
```

`jsonFirst: true` means JSON metadata files appear first in the central
directory, allowing detection without reading the full directory.
