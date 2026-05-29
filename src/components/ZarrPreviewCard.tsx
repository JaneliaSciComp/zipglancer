import { Button, Typography } from '@material-tailwind/react';
import { HiOutlineCube, HiArrowTopRightOnSquare } from 'react-icons/hi2';

import {
  buildZipZarrSource,
  buildSimpleNeuroglancerUrl,
  buildOmeZarrNeuroglancerUrl,
  layerNameFor
} from '@/lib/neuroglancer';
import type { OzxInfo, ZarrRoot } from '@/lib/types';
import type { OmeZarrMetadata } from '@/lib/zarrStore';

type ZarrPreviewCardProps = {
  readonly zipUrl: string;
  readonly root: ZarrRoot;
  readonly ozx: OzxInfo;
  readonly metadata: OmeZarrMetadata | null;
};

export default function ZarrPreviewCard({
  zipUrl,
  root,
  ozx,
  metadata
}: ZarrPreviewCardProps) {
  const source = buildZipZarrSource(zipUrl, root.path, root.version);
  const layerName = layerNameFor(zipUrl, root.path);

  const neuroglancerUrl =
    metadata && root.path === ''
      ? buildOmeZarrNeuroglancerUrl(
          source,
          layerName,
          metadata.multiscale,
          metadata.arr,
          metadata.omero
        )
      : buildSimpleNeuroglancerUrl(source, layerName);

  const rootLabel = root.path ? ` (root: ${root.path})` : '';

  return (
    <div className="rounded-md bg-primary-light/20 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <HiOutlineCube className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <Typography className="font-semibold text-surface-foreground">
              Zarr {root.version} hierarchy detected{rootLabel}
            </Typography>
            {ozx.isOzx ? (
              <Typography className="text-sm text-foreground">
                RFC-9 OZX archive
                {ozx.omeVersion ? ` · OME-Zarr ${ozx.omeVersion}` : ''}
                {ozx.jsonFirst ? ' · jsonFirst' : ''}
              </Typography>
            ) : null}
            {metadata ? (
              <Typography className="text-sm text-foreground">
                {metadata.multiscale.axes?.map(a => a.name).join('') || ''}{' '}
                · shape [{metadata.arr.shape.join(', ')}] · {metadata.arr.dtype}
              </Typography>
            ) : root.path !== '' ? (
              <Typography className="text-xs text-foreground">
                Nested root — opens in Neuroglancer via the zip adapter.
              </Typography>
            ) : null}
          </div>
        </div>
        <a
          href={neuroglancerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button className="flex items-center gap-1">
            Open in Neuroglancer
            <HiArrowTopRightOnSquare className="h-4 w-4" />
          </Button>
        </a>
      </div>
      <Typography className="mt-3 break-all rounded bg-surface-light px-2 py-1 font-mono text-xs text-foreground">
        {source}
      </Typography>
    </div>
  );
}
