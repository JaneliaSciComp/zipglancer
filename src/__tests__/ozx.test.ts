import { describe, it, expect } from 'vitest';

import { parseOzxComment } from '@/lib/ozx';

describe('parseOzxComment', () => {
  it('returns empty info for a null/empty comment', () => {
    expect(parseOzxComment(null)).toEqual({
      isOzx: false,
      omeVersion: null,
      jsonFirst: false
    });
    expect(parseOzxComment('')).toEqual({
      isOzx: false,
      omeVersion: null,
      jsonFirst: false
    });
  });

  it('returns empty info for non-JSON comments', () => {
    expect(parseOzxComment('not json').isOzx).toBe(false);
  });

  it('returns empty info for JSON without an ome block', () => {
    expect(parseOzxComment('{"foo": 1}').isOzx).toBe(false);
  });

  it('parses RFC-9 OZX metadata with jsonFirst', () => {
    const comment = JSON.stringify({
      ome: {
        version: '0.5',
        zipFile: { centralDirectory: { jsonFirst: true } }
      }
    });
    expect(parseOzxComment(comment)).toEqual({
      isOzx: true,
      omeVersion: '0.5',
      jsonFirst: true
    });
  });

  it('defaults jsonFirst to false when not present', () => {
    const comment = JSON.stringify({ ome: { version: '0.5' } });
    expect(parseOzxComment(comment)).toEqual({
      isOzx: true,
      omeVersion: '0.5',
      jsonFirst: false
    });
  });
});
