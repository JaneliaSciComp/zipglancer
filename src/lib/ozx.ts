import type { OzxInfo } from '@/lib/types';

const EMPTY: OzxInfo = { isOzx: false, omeVersion: null, jsonFirst: false };

/**
 * Parse the RFC-9 OZX metadata block from a ZIP archive comment.
 *
 * RFC-9 stores OME metadata as JSON in the ZIP comment, e.g.:
 *
 * ```json
 * { "ome": { "version": "0.5",
 *            "zipFile": { "centralDirectory": { "jsonFirst": true } } } }
 * ```
 *
 * `jsonFirst` indicates that JSON metadata files are sorted first in the
 * central directory, which lets readers locate the Zarr metadata quickly.
 */
export function parseOzxComment(comment: string | null): OzxInfo {
  if (!comment) {
    return EMPTY;
  }
  let parsed: any;
  try {
    parsed = JSON.parse(comment);
  } catch {
    return EMPTY;
  }
  const ome = parsed?.ome;
  if (!ome || typeof ome !== 'object') {
    return EMPTY;
  }
  return {
    isOzx: true,
    omeVersion: typeof ome.version === 'string' ? ome.version : null,
    jsonFirst: Boolean(ome?.zipFile?.centralDirectory?.jsonFirst)
  };
}
