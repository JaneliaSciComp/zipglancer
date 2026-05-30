import type * as omezarr from 'ome-zarr.js';

import type { ZarrVersion } from '@/lib/types';

const NEUROGLANCER_BASE = 'https://neuroglancer-demo.appspot.com/#!';

const UNIT_CONVERSIONS: Record<string, string> = {
  micron: 'um',
  micrometer: 'um',
  millimeter: 'mm',
  nanometer: 'nm',
  centimeter: 'cm',
  meter: 'm',
  second: 's',
  millisecond: 'ms',
  microsecond: 'us',
  nanosecond: 'ns'
};

/**
 * Build the Neuroglancer data source for an OME-Zarr stored inside a ZIP file.
 *
 * Neuroglancer chains data-source adapters with `|`:
 *
 *   `ZIP_URL|zip:INNER_PATH/|zarr3:`
 *
 * `innerPath` is empty for a Zarr at the archive root, or `subdir/` for a
 * nested root. Requires the server hosting ZIP_URL to support HTTP range
 * requests (which fileglancer's `/api/content/` does).
 */
export function buildZipZarrSource(
  zipUrl: string,
  rootPath: string,
  version: ZarrVersion
): string {
  const innerPath = rootPath ? `${rootPath}/` : '';
  const zarrVersion = version === 'v3' ? 3 : 2;
  return `${zipUrl}|zip:${innerPath}|zarr${zarrVersion}:`;
}

function layerNameFor(zipUrl: string, rootPath: string): string {
  return (
    rootPath || zipUrl.split('/').filter(Boolean).pop() || 'zarr-data'
  );
}

function encodeState(state: unknown): string {
  return NEUROGLANCER_BASE + encodeURIComponent(JSON.stringify(state));
}

/**
 * Minimal Neuroglancer URL: a single auto-typed layer. Lets Neuroglancer
 * detect the layer type and channel layout from the Zarr metadata itself.
 */
export function buildSimpleNeuroglancerUrl(
  source: string,
  layerName: string
): string {
  const state = {
    layers: [{ type: 'new', name: layerName, source }],
    selectedLayer: { visible: true, layer: layerName },
    layout: '4panel-alt'
  };
  return encodeState(state);
}

function translateUnit(unit: string | undefined): string {
  if (!unit) {
    return '';
  }
  return UNIT_CONVERSIONS[unit] ?? unit;
}

function getScaleTransform(coordinateTransformations: any[] | undefined) {
  return coordinateTransformations?.find((ct: any) => ct.type === 'scale') as
    | { scale: number[] }
    | undefined;
}

function getResolvedScales(multiscale: omezarr.Multiscale): number[] {
  const rootScales =
    getScaleTransform(multiscale.coordinateTransformations as any[])?.scale ??
    [];
  const dataset = multiscale.datasets[0];
  const scales =
    getScaleTransform(dataset.coordinateTransformations)?.scale ?? [];
  return scales.map((scale, i) => scale * (rootScales[i] || 1));
}

export { layerNameFor, getResolvedScales, translateUnit as translateUnitToNeuroglancer };
