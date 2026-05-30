import type * as omezarr from 'ome-zarr.js';

import type { ZarrArrayLike, ZarrVersion } from '@/lib/types';

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

const SHADER = `#uicontrol invlerp contrast
#uicontrol vec3 color color
void main() {
  float contrast_value = contrast();
  if (VOLUME_RENDERING) {
    emitRGBA(vec4(color * contrast_value, contrast_value));
  }
  else {
    emitRGB(color * contrast_value);
  }
}
`;

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
 * Minimal Neuroglancer URL: a single auto-typed layer. Used for nested Zarr
 * roots where OME-Zarr metadata is unavailable.
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

function getMinMaxValues(arr: ZarrArrayLike): { min: number; max: number } {
  let dtypeMin = 0;
  let dtypeMax = 65535;
  const dtype = arr.dtype;
  if (dtype && (dtype.includes('int') || dtype.includes('uint'))) {
    const bitMatch = dtype.match(/\d+/);
    if (bitMatch) {
      const bitCount = parseInt(bitMatch[0], 10);
      if (dtype.startsWith('u')) {
        dtypeMin = 0;
        dtypeMax = 2 ** bitCount - 1;
      } else {
        dtypeMin = -(2 ** (bitCount - 1));
        dtypeMax = 2 ** (bitCount - 1) - 1;
      }
    }
  }
  return { min: dtypeMin, max: dtypeMax };
}

function getAxesMap(multiscale: omezarr.Multiscale): Record<string, any> {
  const axesMap: Record<string, any> = {};
  multiscale.axes?.forEach((axis, i) => {
    axesMap[axis.name] = { ...axis, index: i };
  });
  return axesMap;
}

/**
 * Rich Neuroglancer URL for an OME-Zarr image: physical dimensions from the
 * multiscale metadata, a contrast shader, and contrast range/window from
 * OMERO channel metadata (or dtype bounds as a fallback). Uses a single image
 * layer so Neuroglancer handles channel layout natively — no c' mapping.
 */
export function buildOmeZarrNeuroglancerUrl(
  source: string,
  layerName: string,
  multiscale: omezarr.Multiscale,
  arr: ZarrArrayLike,
  omero?: omezarr.Omero
): string {
  const axesMap = getAxesMap(multiscale);
  const scales = getResolvedScales(multiscale);

  let layout = '4panel-alt';
  if ('z' in axesMap && arr.shape[axesMap['z'].index] === 1) {
    layout = 'xy';
  }

  const { min: dtypeMin, max: dtypeMax } = getMinMaxValues(arr);

  // OMERO window.start/end → contrast range (active display window)
  // OMERO window.min/max  → contrast window (slider extent)
  let contrastRange: [number, number] | undefined;
  let contrastWindow: [number, number] | undefined;
  if (omero?.channels && omero.channels.length > 0) {
    const win: any = omero.channels[0].window || {};
    if (win.start != null || win.end != null) {
      contrastRange = [win.start ?? dtypeMin, win.end ?? dtypeMax];
    }
    if (win.min != null || win.max != null) {
      contrastWindow = [win.min ?? dtypeMin, win.max ?? dtypeMax];
    }
  }

  const contrast: Record<string, [number, number]> = {
    range: contrastRange ?? [dtypeMin, dtypeMax]
  };
  if (contrastWindow) {
    contrast.window = contrastWindow;
  }

  const state: any = {
    dimensions: {},
    layers: [
      {
        type: 'image',
        source,
        tab: 'source',
        opacity: 1,
        blend: 'additive',
        shader: SHADER,
        shaderControls: { contrast },
        volumeRenderingDepthSamples: 256,
        name: layerName
      }
    ],
    selectedLayer: { visible: true, layer: layerName },
    layout,
    toolPalettes: {
      'Shader controls': { side: 'left', row: 1, query: 'type:shaderControl' }
    }
  };

  for (const name of ['x', 'y', 'z', 't']) {
    const axis = axesMap[name];
    if (axis) {
      state.dimensions[name] = [scales[axis.index], translateUnit(axis.unit)];
    }
  }

  return encodeState(state);
}

export { layerNameFor, getResolvedScales, translateUnit as translateUnitToNeuroglancer };
