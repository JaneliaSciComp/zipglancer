import { describe, it, expect } from 'vitest';

import { formatBytes, isTextLikeEntry, isBinaryEntry } from '@/lib/format';

describe('formatBytes', () => {
  it('returns "0 B" for zero or negative values', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
  });

  it('formats bytes without a decimal', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1024 ** 3)).toBe('1.0 GB');
  });
});

describe('isTextLikeEntry', () => {
  it('recognises Zarr metadata files without extensions', () => {
    expect(isTextLikeEntry('.zattrs')).toBe(true);
    expect(isTextLikeEntry('.zgroup')).toBe(true);
    expect(isTextLikeEntry('.zarray')).toBe(true);
  });

  it('recognises Zarr metadata files in subdirectories', () => {
    expect(isTextLikeEntry('0/.zarray')).toBe(true);
    expect(isTextLikeEntry('deep/path/.zattrs')).toBe(true);
  });

  it('recognises common text extensions', () => {
    expect(isTextLikeEntry('zarr.json')).toBe(true);
    expect(isTextLikeEntry('README.md')).toBe(true);
    expect(isTextLikeEntry('config.yaml')).toBe(true);
    expect(isTextLikeEntry('data.csv')).toBe(true);
  });

  it('returns false for extensionless chunk files', () => {
    expect(isTextLikeEntry('0/c/0/0')).toBe(false);
    expect(isTextLikeEntry('0/0.0')).toBe(false);
  });

  it('returns false for binary extensions', () => {
    expect(isTextLikeEntry('data.bin')).toBe(false);
    expect(isTextLikeEntry('image.png')).toBe(false);
  });
});

describe('isBinaryEntry', () => {
  it('is the inverse of isTextLikeEntry', () => {
    expect(isBinaryEntry('zarr.json')).toBe(false);
    expect(isBinaryEntry('0/c/0/0')).toBe(true);
    expect(isBinaryEntry('.zattrs')).toBe(false);
  });
});
