import type * as omezarr from 'ome-zarr.js';

import type { ZarrArrayLike, ZarrVersion } from '@/lib/types';

const NEUROGLANCER_BASE = 'https://neuroglancer-demo.appspot.com/#!';

const COLORS = ['magenta', 'green', 'cyan', 'white', 'red', 'yellow', 'blue'];

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
  float c = contrast();
  if (VOLUME_RENDERING) {
    emitRGBA(vec4(color * c, c));
  }
  else {
    emitRGB(color * c);
  }
}`;

type OmeZarrChannel = {
  name: string;
  color: string;
  contrast_window: number[] | undefined;
  contrast_range: number[] | undefined;
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
 * Minimal Neuroglancer URL: a single auto-typed layer. Used when rich OME-Zarr
 * metadata is unavailable (e.g. a nested Zarr root, or a non-OME Zarr group).
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
 * Build a full Neuroglancer URL for an OME-Zarr image: per-channel layers with
 * colors/contrast from omero metadata, resolved physical dimensions, and a
 * shader. Adapted from fileglancer's omezarr-helper.
 */
export function buildOmeZarrNeuroglancerUrl(
  source: string,
  layerName: string,
  multiscale: omezarr.Multiscale,
  arr: ZarrArrayLike,
  omero?: omezarr.Omero
): string {
  const axesMap = getAxesMap(multiscale);

  let layout = '4panel-alt';
  if ('z' in axesMap && arr.shape[axesMap['z'].index] === 1) {
    layout = 'xy';
  }

  const { min: dtypeMin, max: dtypeMax } = getMinMaxValues(arr);

  const state: any = {
    dimensions: {},
    layers: [],
    selectedLayer: { layer: layerName },
    layout,
    toolPalettes: {
      'Shader controls': { side: 'left', row: 3, query: 'type:shaderControl' }
    }
  };

  const scales = getResolvedScales(multiscale);
  for (const name of ['x', 'y', 'z', 't']) {
    const axis = axesMap[name];
    if (axis) {
      state.dimensions[name] = [scales[axis.index], translateUnit(axis.unit)];
    }
  }

  let colorIndex = 0;
  const channels: OmeZarrChannel[] = [];
  if (omero?.channels) {
    omero.channels.forEach((channelMeta, i) => {
      const window = channelMeta.window || {};
      const channel: OmeZarrChannel = {
        name: (channelMeta.label as string) || `Ch${i}`,
        color: channelMeta.color || COLORS[colorIndex++ % COLORS.length],
        contrast_window: undefined,
        contrast_range: undefined
      };
      if (window.min != null || window.max != null) {
        channel.contrast_window = [window.min ?? dtypeMin, window.max ?? dtypeMax];
      }
      if (window.start != null || window.end != null) {
        channel.contrast_range = [
          window.start ?? (window.min ?? dtypeMin),
          window.end ?? (window.max ?? dtypeMax)
        ];
      }
      channels.push(channel);
    });
  } else if ('c' in axesMap) {
    const numChannels = arr.shape[axesMap['c'].index];
    for (let i = 0; i < numChannels; i++) {
      channels.push({
        name: `Ch${i}`,
        color: COLORS[colorIndex++ % COLORS.length],
        contrast_range: [dtypeMin, dtypeMax],
        contrast_window: [dtypeMin, dtypeMax]
      });
    }
  }

  if (channels.length === 0) {
    state.layers.push({
      name: layerName,
      type: 'image',
      source,
      tab: 'rendering',
      opacity: 1,
      blend: 'additive',
      shaderControls: { normalized: { range: [dtypeMin, dtypeMax] } }
    });
  } else {
    if (channels.length === 1) {
      channels[0].color = 'white';
    }
    channels.forEach((channel, i) => {
      let color = channel.color;
      if (/^[\dA-F]{6}$/i.test(color)) {
        color = '#' + color;
      }
      const localDimensions = { "c'": [1, translateUnit(axesMap['c']?.unit)] };
      const layer: any = {
        name: channel.name,
        type: 'image',
        source: { url: source, transform: { outputDimensions: localDimensions } },
        tab: 'rendering',
        archived: i >= 4,
        opacity: 1,
        blend: 'additive',
        shader: SHADER,
        shaderControls: { color },
        localDimensions,
        localPosition: [i]
      };
      if (channel.contrast_range) {
        layer.shaderControls.contrast = { range: channel.contrast_range };
      }
      if (channel.contrast_window) {
        layer.shaderControls.contrast = {
          ...layer.shaderControls.contrast,
          window: channel.contrast_window
        };
      }
      state.layers.push(layer);
    });
    if (channels.length > 4) {
      state.layerListPanel = { visible: true };
    }
    state.selectedLayer.layer = channels[0].name;
  }

  return encodeState(state);
}

export { layerNameFor };
