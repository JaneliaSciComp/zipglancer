export type ZarrVersion = 'v2' | 'v3';

/** A single entry in a ZIP central directory. */
export type ZipEntry = {
  name: string;
  isDirectory: boolean;
  uncompressedSize: number;
  compressedSize: number;
};

/** RFC-9 OME-Zarr OZX metadata parsed from the ZIP archive comment. */
export type OzxInfo = {
  /** True when the ZIP comment carries an `ome` metadata block. */
  isOzx: boolean;
  /** OME-Zarr version declared in the comment (e.g. "0.5"), if any. */
  omeVersion: string | null;
  /** RFC-9 optimization: JSON metadata sorted first in the central directory. */
  jsonFirst: boolean;
};

/**
 * Minimal structural view of a Zarr array. Used instead of a concrete
 * `zarrita.Array` so that arrays produced by ome-zarr.js's bundled copy of
 * zarrita remain assignable (they carry private fields that otherwise make the
 * nominal types incompatible across package copies).
 */
export type ZarrArrayLike = {
  shape: number[];
  dtype: string;
};

/** A detected Zarr hierarchy root inside an archive. */
export type ZarrRoot = {
  /** Path within the ZIP to the Zarr root ('' for the archive root). */
  path: string;
  version: ZarrVersion;
};
