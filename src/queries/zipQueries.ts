import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { openZip } from '@/lib/zipReader';
import type { OpenedZip } from '@/lib/zipReader';
import { parseOzxComment } from '@/lib/ozx';
import { findZarrRoots, pickPrimaryRoot } from '@/lib/zarrDetect';
import { readOmeZarrAtRoot } from '@/lib/zarrStore';
import type { OmeZarrMetadata } from '@/lib/zarrStore';
import type { OzxInfo, ZarrRoot } from '@/lib/types';

export type ZipArchiveData = {
  zip: OpenedZip;
  ozx: OzxInfo;
  zarrRoots: ZarrRoot[];
  primaryRoot: ZarrRoot | null;
};

/**
 * Open a remote ZIP archive: read its central directory, parse RFC-9 OZX
 * metadata from the comment, and detect any Zarr roots.
 */
export function useZipArchive(
  url: string | null
): UseQueryResult<ZipArchiveData, Error> {
  return useQuery({
    queryKey: ['zip-archive', url ?? ''],
    enabled: !!url,
    // ZipFileStore/zip.js keep network handles; never garbage collect mid-session.
    gcTime: Infinity,
    queryFn: async () => {
      const zip = await openZip(url!);
      const ozx = parseOzxComment(zip.comment);
      const zarrRoots = findZarrRoots(zip.entries.map(e => e.name));
      return { zip, ozx, zarrRoots, primaryRoot: pickPrimaryRoot(zarrRoots) };
    }
  });
}

/**
 * Read rich OME-Zarr metadata for a root-level Zarr in the archive. Disabled
 * for nested roots (Neuroglancer still works via the `zip:` adapter, but rich
 * metadata is only read at the archive root in this version).
 */
export function useOmeZarrMetadata(
  url: string | null,
  primaryRoot: ZarrRoot | null
): UseQueryResult<OmeZarrMetadata | null, Error> {
  const enabled = !!url && !!primaryRoot && primaryRoot.path === '';
  return useQuery({
    queryKey: ['ome-zarr-metadata', url ?? '', primaryRoot?.path ?? ''],
    enabled,
    queryFn: async () => readOmeZarrAtRoot(url!)
  });
}
