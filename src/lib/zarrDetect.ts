import type { ZarrRoot, ZarrVersion } from '@/lib/types';

const V3_META = 'zarr.json';
const V2_GROUP = '.zgroup';
const V2_ATTRS = '.zattrs';
const V2_ARRAY = '.zarray';

function baseName(name: string): string {
  const idx = name.lastIndexOf('/');
  return idx === -1 ? name : name.slice(idx + 1);
}

function dirName(name: string): string {
  const idx = name.lastIndexOf('/');
  return idx === -1 ? '' : name.slice(0, idx);
}

function depth(path: string): number {
  return path === '' ? 0 : path.split('/').length;
}

/**
 * Find candidate Zarr roots from a list of ZIP entry names (pure, no I/O).
 *
 * Detects Zarr v3 (`zarr.json`) and Zarr v2 (`.zgroup`/`.zattrs`/`.zarray`)
 * metadata at the archive root or nested within subdirectories. When both a v3
 * and a v2 marker exist for the same directory, v3 wins. Roots are returned
 * shallowest-first so the natural top-level dataset is the first element.
 */
export function findZarrRoots(entryNames: string[]): ZarrRoot[] {
  const roots = new Map<string, ZarrVersion>();
  for (const raw of entryNames) {
    const name = raw.replace(/^\/+/, '');
    const base = baseName(name);
    let version: ZarrVersion | null = null;
    if (base === V3_META) {
      version = 'v3';
    } else if (base === V2_GROUP || base === V2_ATTRS || base === V2_ARRAY) {
      version = 'v2';
    }
    if (!version) {
      continue;
    }
    const root = dirName(name);
    // Prefer v3 if a directory has both kinds of markers.
    if (!roots.has(root) || version === 'v3') {
      roots.set(root, version);
    }
  }
  return [...roots.entries()]
    .map(([path, version]) => ({ path, version }))
    .sort((a, b) => depth(a.path) - depth(b.path) || a.path.localeCompare(b.path));
}

/** Pick the most likely top-level Zarr root (shallowest), or null if none. */
export function pickPrimaryRoot(roots: ZarrRoot[]): ZarrRoot | null {
  return roots.length > 0 ? roots[0] : null;
}

/**
 * Confirm whether a parsed Zarr metadata document describes an OME-Zarr
 * multiscales image. Accepts the JSON of a v2 `.zattrs` or a v3 `zarr.json`.
 */
export function isOmeZarrMetadata(meta: any, version: ZarrVersion): boolean {
  if (!meta || typeof meta !== 'object') {
    return false;
  }
  if (version === 'v2') {
    return Array.isArray(meta.multiscales) && meta.multiscales.length > 0;
  }
  // v3: OME metadata lives under attributes.ome (OME-Zarr 0.5) or attributes.
  const attrs = meta.attributes ?? {};
  const ome = attrs.ome ?? attrs;
  return Array.isArray(ome?.multiscales) && ome.multiscales.length > 0;
}

/** The metadata file name for a given Zarr root and version. */
export function metadataFileFor(root: ZarrRoot): string {
  const prefix = root.path ? `${root.path}/` : '';
  return root.version === 'v3' ? `${prefix}zarr.json` : `${prefix}.zattrs`;
}
