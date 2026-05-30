import ZipFileStore from '@zarrita/storage/zip';
import * as omezarr from 'ome-zarr.js';

import type { ZarrArrayLike } from '@/lib/types';

/**
 * Rich OME-Zarr metadata extracted for building a Neuroglancer link and
 * rendering the metadata tables.
 */
export type OmeZarrMetadata = {
  arr: ZarrArrayLike;
  multiscale: omezarr.Multiscale;
  omero: omezarr.Omero | undefined;
  zarrVersion: 2 | 3;
  shapes: number[][] | undefined;
  scales: number[][] | undefined;
};

/**
 * Read OME-Zarr metadata for a Zarr at the archive root via HTTP range requests.
 * Returns null if the archive can't be read as OME-Zarr.
 */
export async function readOmeZarrAtRoot(
  zipUrl: string
): Promise<OmeZarrMetadata | null> {
  try {
    const store = ZipFileStore.fromUrl(zipUrl);
    const { arr, shapes, multiscale, omero, scales, zarr_version } =
      await omezarr.getMultiscaleWithArray(store as any, 0);
    if (!arr || !multiscale) {
      return null;
    }
    const arrLike: ZarrArrayLike = {
      shape: arr.shape,
      dtype: arr.dtype,
      chunks: (arr as any).chunks
    };
    return {
      arr: arrLike,
      multiscale,
      omero: omero ?? undefined,
      zarrVersion: zarr_version,
      shapes: shapes ?? undefined,
      scales: scales ?? undefined
    };
  } catch {
    return null;
  }
}

/**
 * Render a thumbnail image (base64 data URL) for the OME-Zarr at the archive root.
 * Returns null on failure — callers should fall back to the zarr logo.
 */
export async function renderOmeZarrThumbnail(
  zipUrl: string,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const store = ZipFileStore.fromUrl(zipUrl);
    return await (omezarr as any).renderThumbnail(store as any, 300, true, 1024, signal);
  } catch {
    return null;
  }
}
