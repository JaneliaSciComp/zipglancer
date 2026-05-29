import { describe, it, expect } from 'vitest';

import {
  buildZipZarrSource,
  buildSimpleNeuroglancerUrl,
  layerNameFor
} from '@/lib/neuroglancer';

const ZIP_URL = 'https://example.org/api/content/myFsp/data.ozx';

describe('buildZipZarrSource', () => {
  it('builds a root v3 source with an empty inner path', () => {
    expect(buildZipZarrSource(ZIP_URL, '', 'v3')).toBe(
      `${ZIP_URL}|zip:|zarr3:`
    );
  });

  it('builds a v2 source for a nested root with a trailing slash', () => {
    expect(buildZipZarrSource(ZIP_URL, 'sub/dir', 'v2')).toBe(
      `${ZIP_URL}|zip:sub/dir/|zarr2:`
    );
  });
});

describe('layerNameFor', () => {
  it('uses the root path when present', () => {
    expect(layerNameFor(ZIP_URL, 'image')).toBe('image');
  });

  it('falls back to the final URL segment for a root Zarr', () => {
    expect(layerNameFor(ZIP_URL, '')).toBe('data.ozx');
  });
});

describe('buildSimpleNeuroglancerUrl', () => {
  it('embeds the source in a decodable Neuroglancer state', () => {
    const source = buildZipZarrSource(ZIP_URL, '', 'v3');
    const url = buildSimpleNeuroglancerUrl(source, 'data.ozx');
    expect(url.startsWith('https://neuroglancer-demo.appspot.com/#!')).toBe(
      true
    );
    const encoded = url.split('#!')[1];
    const state = JSON.parse(decodeURIComponent(encoded));
    expect(state.layers[0].source).toBe(source);
    expect(state.layers[0].name).toBe('data.ozx');
  });
});
