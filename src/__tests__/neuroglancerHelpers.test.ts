import { describe, it, expect } from 'vitest';

import {
  translateUnitToNeuroglancer,
  getResolvedScales
} from '@/lib/neuroglancer';

describe('translateUnitToNeuroglancer', () => {
  it('converts verbose unit names to SI abbreviations', () => {
    expect(translateUnitToNeuroglancer('micrometer')).toBe('um');
    expect(translateUnitToNeuroglancer('micron')).toBe('um');
    expect(translateUnitToNeuroglancer('nanometer')).toBe('nm');
    expect(translateUnitToNeuroglancer('millimeter')).toBe('mm');
    expect(translateUnitToNeuroglancer('millisecond')).toBe('ms');
  });

  it('passes through already-correct SI abbreviations unchanged', () => {
    expect(translateUnitToNeuroglancer('um')).toBe('um');
    expect(translateUnitToNeuroglancer('nm')).toBe('nm');
  });

  it('returns an empty string for undefined or empty input', () => {
    expect(translateUnitToNeuroglancer(undefined as any)).toBe('');
    expect(translateUnitToNeuroglancer('')).toBe('');
  });

  it('passes through unknown units unchanged', () => {
    expect(translateUnitToNeuroglancer('parsec')).toBe('parsec');
  });
});

describe('getResolvedScales', () => {
  it('multiplies dataset scales by root coordinate transform scales', () => {
    const multiscale = {
      axes: [{ name: 'z' }, { name: 'y' }, { name: 'x' }],
      datasets: [{
        path: '0',
        coordinateTransformations: [{ type: 'scale', scale: [2, 0.5, 0.5] }]
      }],
      coordinateTransformations: [{ type: 'scale', scale: [1000, 1000, 1000] }]
    } as any;
    const scales = getResolvedScales(multiscale);
    expect(scales).toEqual([2000, 500, 500]);
  });

  it('uses dataset scales directly when no root transform is present', () => {
    const multiscale = {
      axes: [{ name: 'y' }, { name: 'x' }],
      datasets: [{
        path: '0',
        coordinateTransformations: [{ type: 'scale', scale: [0.2, 0.2] }]
      }],
      coordinateTransformations: undefined
    } as any;
    const scales = getResolvedScales(multiscale);
    expect(scales).toEqual([0.2, 0.2]);
  });
});
