import {
  ZipReader,
  HttpRangeReader,
  TextWriter,
  Uint8ArrayWriter,
  type FileEntry
} from '@zip.js/zip.js';

import type { ZipEntry } from '@/lib/types';

/**
 * An opened remote ZIP archive. The underlying central directory is read once
 * via HTTP range requests; individual entries are decompressed lazily on demand
 * (also via range requests against the original URL).
 */
export type OpenedZip = {
  url: string;
  entries: ZipEntry[];
  /** Decoded ZIP archive comment (used to carry RFC-9 OZX metadata), if present. */
  comment: string | null;
  /** Read a single entry as UTF-8 text. */
  readText: (name: string) => Promise<string>;
  /** Read a single entry as raw bytes. */
  readBytes: (name: string) => Promise<Uint8Array>;
  /** Release the underlying reader. */
  close: () => Promise<void>;
};

/**
 * Open a ZIP archive available at a (range-capable) HTTP URL and read its
 * central directory. No entry data is downloaded until {@link OpenedZip.readText}
 * or {@link OpenedZip.readBytes} is called.
 */
export async function openZip(url: string): Promise<OpenedZip> {
  // forceRangeRequests: skip the Accept-Ranges header check. Some servers
  // (e.g. S3) support range requests but don't expose Accept-Ranges via CORS
  // Access-Control-Expose-Headers, so zip.js would otherwise throw ERR_HTTP_RANGE.
  // Content-Length is a CORS-safelisted header, so the size fallback (HEAD
  // request) still works even when Content-Range is not exposed.
  const reader = new ZipReader(new HttpRangeReader(url, { forceRangeRequests: true } as any));
  const rawEntries = await reader.getEntries();

  const byName = new Map<string, FileEntry>();
  const entries: ZipEntry[] = rawEntries.map(e => {
    if (!e.directory) {
      byName.set(e.filename, e);
    }
    return {
      name: e.filename,
      isDirectory: e.directory,
      uncompressedSize: e.uncompressedSize ?? 0,
      compressedSize: e.compressedSize ?? 0
    };
  });

  // The ZIP end-of-central-directory comment carries RFC-9 OZX metadata.
  let comment: string | null = null;
  if (reader.comment && reader.comment.length > 0) {
    comment = new TextDecoder().decode(reader.comment);
  }

  const getEntry = (name: string): FileEntry => {
    const entry = byName.get(name);
    if (!entry) {
      throw new Error(`File entry not found in zip: ${name}`);
    }
    return entry;
  };

  return {
    url,
    entries,
    comment,
    readText: async name =>
      (await getEntry(name).getData(new TextWriter())) as string,
    readBytes: async name =>
      (await getEntry(name).getData(new Uint8ArrayWriter())) as Uint8Array,
    close: () => reader.close()
  };
}
