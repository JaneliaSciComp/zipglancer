import type * as omezarr from 'ome-zarr.js';

import { getResolvedScales, translateUnitToNeuroglancer } from '@/lib/neuroglancer';
import type { ZarrArrayLike } from '@/lib/types';

type Props = {
  readonly zarrVersion: 2 | 3;
  readonly arr: ZarrArrayLike;
  readonly multiscale: omezarr.Multiscale;
  readonly shapes: number[][] | undefined;
};

function getAxisData(
  multiscale: omezarr.Multiscale,
  arr: ZarrArrayLike,
  shapes: number[][] | undefined
) {
  if (!multiscale?.axes || !shapes?.[0]) {
    return [];
  }
  try {
    const resolvedScales = getResolvedScales(multiscale);
    return multiscale.axes.map((axis: any, index: number) => ({
      name: axis.name.toUpperCase(),
      shape: shapes[0][index] ?? 'Unknown',
      chunkSize: arr.chunks?.[index] ?? '—',
      scale:
        resolvedScales?.[index] != null
          ? Number.isInteger(resolvedScales[index])
            ? String(resolvedScales[index])
            : resolvedScales[index].toFixed(4)
          : '—',
      unit: translateUnitToNeuroglancer(axis.unit) || ''
    }));
  } catch {
    return [];
  }
}

export default function ZarrMetadataTable({
  zarrVersion,
  arr,
  multiscale,
  shapes
}: Props) {
  const axisData = getAxisData(multiscale, arr, shapes);

  return (
    <>
      <table className="bg-background/90">
        <tbody className="text-sm">
          <tr className="h-11 border-y border-surface-dark">
            <td className="px-3 py-2 font-semibold" colSpan={2}>
              OME-Zarr Metadata
            </td>
          </tr>
          <tr className="h-11 border-y border-surface-dark">
            <td className="px-3 py-2 font-semibold">Zarr Version</td>
            <td className="px-3 py-2">v{zarrVersion}</td>
          </tr>
          <tr className="h-11 border-b border-surface-dark">
            <td className="px-3 py-2 font-semibold">Data Type</td>
            <td className="px-3 py-2">{arr.dtype}</td>
          </tr>
          {shapes ? (
            <tr className="h-11 border-b border-surface-dark">
              <td className="px-3 py-2 font-semibold">Multiscale Levels</td>
              <td className="px-3 py-2">{shapes.length}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {axisData.length > 0 ? (
        <table className="bg-background/90">
          <thead className="text-sm">
            <tr className="h-11 border-y border-surface-dark">
              <th className="px-3 py-2 font-semibold text-left">Axes</th>
              <th className="px-3 py-2 font-semibold text-left">Shape</th>
              <th className="px-3 py-2 font-semibold text-left">Chunk Size</th>
              <th className="px-3 py-2 font-semibold text-left">Scale</th>
              <th className="px-3 py-2 font-semibold text-left">Unit</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {axisData.map(axis => (
              <tr className="h-11 border-b border-surface-dark" key={axis.name}>
                <td className="px-3 py-2 text-center">{axis.name}</td>
                <td className="px-3 py-2 text-right">{axis.shape}</td>
                <td className="px-3 py-2 text-right">{axis.chunkSize}</td>
                <td className="px-3 py-2 text-right">{axis.scale}</td>
                <td className="px-3 py-2 text-left">{axis.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  );
}
