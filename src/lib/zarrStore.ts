import ZipFileStore from '@zarrita/storage/zip';
import * as omezarr from 'ome-zarr.js';

import type { ZarrArrayLike } from '@/lib/types';

/**
 * Rich OME-Zarr metadata extracted for building a Neuroglancer link.
 */
export type OmeZarrMetadata = {
  arr: ZarrArrayLike;
  multiscale: omezarr.Multiscale;
  omero: omezarr.Omero | undefined;
  zarrVersion: 2 | 3;
};

/**
 * Read OME-Zarr metadata for a Zarr located at the **root** of a remote ZIP
 * archive, using zarrita's ZipFileStore (which reads zip entries lazily via
 * HTTP range requests) together with ome-zarr.js.
 *
 * Returns `null` if the archive can't be read as an OME-Zarr image. Nested Zarr
 * roots are not read here (the Neuroglancer link still works via the `zip:`
 * adapter); only the root case yields rich metadata in this version.
 */
export async function readOmeZarrAtRoot(
  zipUrl: string
): Promise<OmeZarrMetadata | null> {
  try {
    // ZipFileStore reads zip entries lazily via HTTP range requests.
    // fromUrl is synchronous. ome-zarr.js types the store as FetchStore, but
    // accepts any zarrita AsyncReadable store at runtime.
    const store = ZipFileStore.fromUrl(zipUrl);
    const { arr, multiscale, omero, zarr_version } =
      await omezarr.getMultiscaleWithArray(store as any, 0);
    if (!arr || !multiscale) {
      return null;
    }
    return {
      arr,
      multiscale,
      omero: omero ?? undefined,
      zarrVersion: zarr_version
    };
  } catch {
    return null;
  }
}
