# CLAUDE.md — Zipglancer Development Guide

## Project Overview

Zipglancer is a standalone client-side SPA for exploring `.zip` and `.ozx`
(RFC-9 OZX) archives on the web. All ZIP parsing and Zarr reading happens in the
browser via HTTP range requests — there is no backend.

- **Framework**: React 18 + TypeScript 5.8 + Vite 6
- **Styling**: Tailwind CSS 3 + Material Tailwind v3 beta (same theme as fileglancer)
- **State**: TanStack Query v5 for async archive reads
- **Key libs**: `@zip.js/zip.js` (ZIP reader), `@zarrita/storage` (ZipFileStore),
  `ome-zarr.js` (OME-Zarr metadata), `react-syntax-highlighter` (code preview),
  `fracturedjsonjs` (JSON formatting)

## Available Scripts

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # Production build → dist/
npm run typecheck    # TypeScript type-check (no emit)
npm test             # Vitest unit tests
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run format:check # Prettier (check only)
```

### GitHub Pages build

```bash
ZIPGLANCER_BASE=/zipglancer/ npm run build
```

The `ZIPGLANCER_BASE` env var sets Vite's `base` option so assets resolve
correctly when co-served at a sub-path (e.g. under fileglancer).

## Project Structure

```
zipglancer/
├── index.html               # Vite entry point
├── vite.config.ts           # Vite + Vitest config
├── tailwind.config.js       # Tailwind theme (copied from fileglancer)
├── src/
│   ├── main.tsx             # React bootstrap + QueryClient
│   ├── App.tsx              # Root component: URL input, suggestions, Explorer
│   ├── index.css            # Tailwind directives
│   ├── vite-env.d.ts        # Asset module declarations
│   │
│   ├── lib/                 # Pure logic, no React
│   │   ├── types.ts         # ZipEntry, ZarrRoot, OzxInfo, ZarrArrayLike
│   │   ├── zipReader.ts     # openZip() via @zip.js/zip.js HttpRangeReader
│   │   ├── ozx.ts           # parseOzxComment() — RFC-9 ZIP comment parser
│   │   ├── zarrDetect.ts    # findZarrRoots(), isOmeZarrMetadata()
│   │   ├── zarrStore.ts     # readOmeZarrAtRoot(), renderOmeZarrThumbnail()
│   │   ├── neuroglancer.ts  # buildZipZarrSource(), Neuroglancer state/URL builders
│   │   └── format.ts        # formatBytes(), isBinaryEntry(), isTextLikeEntry()
│   │
│   ├── queries/
│   │   └── zipQueries.ts    # useZipArchive, useOmeZarrMetadata, useOmeZarrThumbnail
│   │
│   ├── hooks/
│   │   └── useDarkMode.ts   # Reads prefers-color-scheme media query
│   │
│   ├── components/
│   │   ├── Header.tsx           # App header with logo
│   │   ├── UrlInput.tsx         # ZIP/OZX URL input form
│   │   ├── SuggestedDatasets.tsx # OME-Zarr Open SciVis dataset list
│   │   ├── EntryList.tsx        # Hierarchical ZIP tree (collapsible dirs)
│   │   ├── EntryPreview.tsx     # Syntax-highlighted text / hex dump viewer
│   │   ├── HexDump.tsx          # Classic hex dump for binary entries
│   │   ├── ZarrPreviewCard.tsx  # Teal OME-Zarr preview card (collapsible)
│   │   ├── ZarrMetadataTable.tsx  # OME-Zarr Metadata + Axes tables
│   │   └── OzxPropertiesTable.tsx # RFC-9 OZX properties table
│   │
│   ├── data/
│   │   └── sciVisDatasets.ts    # 51 OME-Zarr Open SciVis dataset entries
│   │
│   └── assets/
│       ├── neuroglancer.png     # Neuroglancer logo (from fileglancer)
│       └── zarr.jpg             # Zarr logo (from fileglancer)
│
├── .github/workflows/deploy.yml  # GitHub Pages CI/CD
└── public/
    └── logo.svg                  # Zipglancer logo
```

## Key Conventions

### Styling

- Use Tailwind utility classes. Colors come from the Material Tailwind theme
  defined in `tailwind.config.js` — use semantic names (`text-primary`,
  `bg-surface-light`, `border-surface`, `text-foreground`, etc.).
- Match fileglancer's visual style: same theme, same icon libraries
  (`react-icons/hi2` for UI icons, `react-icons/tb` for file icons).
- Folder icon: `HiFolder` (`hi2`) — `h-5 w-5 text-foreground`
- File icon: `TbFile` (`tb`) — `h-4 w-4 text-foreground`

### Icons

- UI actions: `react-icons/hi2` (Heroicons v2)
- File/folder: `react-icons/hi2` + `react-icons/tb`
- Older icons where needed: `react-icons/hi` (Heroicons v1)

### Tooltips

Use Material Tailwind's compound Tooltip:
```tsx
<Tooltip>
  <Tooltip.Trigger as="div">...</Tooltip.Trigger>
  <Tooltip.Content>Label<Tooltip.Arrow /></Tooltip.Content>
</Tooltip>
```

### Height / scrolling

Each panel that should independently scroll needs:
- A constrained height from its container (`h-full`, `flex-1 min-h-0`, or grid
  row sizing)
- `overflow-auto` on the scrollable inner div
- The grid container uses `lg:grid-rows-1` to constrain row height on desktop

### Binary vs. text detection

`isBinaryEntry(name)` in `lib/format.ts` returns `true` for entries with no
extension or unknown extensions. Text entries get the syntax highlighter;
binary entries get the hex dump.

## Testing

```bash
npm test             # Run all unit tests
```

Tests live in `src/__tests__/`. Currently covers:
- `zarrDetect.test.ts` — Zarr root detection (v2/v3, root/nested)
- `ozx.test.ts` — RFC-9 OZX comment parsing
- `neuroglancer.test.ts` — Neuroglancer source string construction

## Deployment

Deployed to GitHub Pages at **https://janeliascicomp.github.io/zipglancer/**
via `.github/workflows/deploy.yml` on every push to `main`.

## Related

- **Fileglancer**: https://github.com/JaneliaSciComp/fileglancer — the companion
  file browser; produces range-capable data links that zipglancer can open via
  `?url=<data-link>`
- **OME-Zarr Open SciVis Datasets**:
  https://github.com/InsightSoftwareConsortium/OMEZarrOpenSciVisDatasets
