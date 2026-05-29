import { describe, it, expect } from 'vitest';

import {
  findZarrRoots,
  pickPrimaryRoot,
  isOmeZarrMetadata,
  metadataFileFor
} from '@/lib/zarrDetect';

describe('findZarrRoots', () => {
  it('detects a v3 Zarr at the archive root', () => {
    const roots = findZarrRoots(['zarr.json', '0/zarr.json', '0/c/0/0']);
    expect(roots).toContainEqual({ path: '', version: 'v3' });
    expect(pickPrimaryRoot(roots)).toEqual({ path: '', version: 'v3' });
  });

  it('detects a v2 Zarr at the archive root', () => {
    const roots = findZarrRoots(['.zgroup', '.zattrs', '0/.zarray', '0/0.0']);
    expect(pickPrimaryRoot(roots)).toEqual({ path: '', version: 'v2' });
  });

  it('detects a nested Zarr root and returns it shallowest-first', () => {
    const roots = findZarrRoots([
      'readme.txt',
      'data/image.ome.zarr/zarr.json',
      'data/image.ome.zarr/0/zarr.json'
    ]);
    expect(pickPrimaryRoot(roots)).toEqual({
      path: 'data/image.ome.zarr',
      version: 'v3'
    });
  });

  it('prefers v3 over v2 when both markers exist for the same directory', () => {
    const roots = findZarrRoots(['.zgroup', 'zarr.json']);
    expect(roots).toEqual([{ path: '', version: 'v3' }]);
  });

  it('returns no roots for an archive without Zarr metadata', () => {
    const roots = findZarrRoots(['a.txt', 'b/c.csv']);
    expect(roots).toEqual([]);
    expect(pickPrimaryRoot(roots)).toBeNull();
  });

  it('ignores a leading slash on entry names', () => {
    const roots = findZarrRoots(['/zarr.json']);
    expect(roots).toEqual([{ path: '', version: 'v3' }]);
  });
});

describe('isOmeZarrMetadata', () => {
  it('recognizes v2 multiscales', () => {
    expect(isOmeZarrMetadata({ multiscales: [{}] }, 'v2')).toBe(true);
    expect(isOmeZarrMetadata({ multiscales: [] }, 'v2')).toBe(false);
    expect(isOmeZarrMetadata({}, 'v2')).toBe(false);
  });

  it('recognizes v3 multiscales under attributes.ome', () => {
    expect(
      isOmeZarrMetadata({ attributes: { ome: { multiscales: [{}] } } }, 'v3')
    ).toBe(true);
  });

  it('recognizes v3 multiscales directly under attributes', () => {
    expect(
      isOmeZarrMetadata({ attributes: { multiscales: [{}] } }, 'v3')
    ).toBe(true);
  });
});

describe('metadataFileFor', () => {
  it('builds the metadata path for root and nested roots', () => {
    expect(metadataFileFor({ path: '', version: 'v3' })).toBe('zarr.json');
    expect(metadataFileFor({ path: '', version: 'v2' })).toBe('.zattrs');
    expect(metadataFileFor({ path: 'a/b', version: 'v3' })).toBe('a/b/zarr.json');
  });
});
