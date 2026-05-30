import { useState } from 'react';
import { Tooltip, Typography } from '@material-tailwind/react';
import { HiOutlineClipboardCopy } from 'react-icons/hi';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';

import zarrLogo from '@/assets/zarr.jpg';
import neuroglancer_logo from '@/assets/neuroglancer.png';
import ZarrMetadataTable from '@/components/ZarrMetadataTable';
import {
  buildZipZarrSource,
  buildSimpleNeuroglancerUrl,
  buildOmeZarrNeuroglancerUrl,
  layerNameFor
} from '@/lib/neuroglancer';
import type { OzxInfo, ZarrRoot } from '@/lib/types';
import type { OmeZarrMetadata } from '@/lib/zarrStore';
import { useOmeZarrThumbnail } from '@/queries/zipQueries';

type ZarrPreviewCardProps = {
  readonly zipUrl: string;
  readonly root: ZarrRoot;
  readonly ozx: OzxInfo;
  readonly metadata: OmeZarrMetadata | null;
};

const CIRCLE_CLASSES =
  'rounded-full bg-surface-light dark:bg-primary/15 hover:bg-surface dark:hover:bg-primary/25 w-12 h-12 flex items-center justify-center cursor-pointer transform active:scale-90 transition-all duration-75';

const LABEL_CLASSES = 'text-xs text-center text-foreground mt-1';

export default function ZarrPreviewCard({
  zipUrl,
  root,
  ozx,
  metadata
}: ZarrPreviewCardProps) {
  const source = buildZipZarrSource(zipUrl, root.path, root.version);
  const layerName = layerNameFor(zipUrl, root.path);
  const thumbnailQuery = useOmeZarrThumbnail(zipUrl, root);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(source).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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

  const versionLabel = `OME-Zarr ${root.version}`;
  const fileName = zipUrl.split('/').filter(Boolean).pop() ?? zipUrl;

  return (
    <div className="min-w-full shadow-sm rounded-md bg-primary-light/30">
      {/* Collapse toggle bar */}
      <button
        className="flex w-full items-center justify-between px-4 py-2 text-left"
        onClick={() => setCollapsed(c => !c)}
      >
        <Typography className="font-semibold text-sm text-surface-foreground">
          {versionLabel} detected · {fileName}
        </Typography>
        {collapsed
          ? <HiChevronDown className="h-4 w-4 shrink-0 text-foreground" />
          : <HiChevronUp className="h-4 w-4 shrink-0 text-foreground" />}
      </button>

      {collapsed ? null : (
      <div className="px-4 pb-4">
      <div className="flex gap-12 w-full h-fit">

        {/* LEFT COLUMN: thumbnail only */}
        <div className="flex flex-col gap-2 shrink-0">
          {thumbnailQuery.isPending && root.path === '' ? (
            <div className="w-72 h-72 animate-pulse bg-surface text-foreground flex">
              <Typography className="place-self-center text-center w-full">
                Loading thumbnail…
              </Typography>
            </div>
          ) : thumbnailQuery.data ? (
            <img
              alt="Thumbnail"
              className="max-h-72 max-w-max rounded-md"
              src={thumbnailQuery.data}
            />
          ) : (
            <div className="p-2">
              <img
                alt="Zarr logo"
                className="max-h-44 rounded-md"
                src={zarrLogo}
              />
              {thumbnailQuery.isError ? (
                <Typography className="text-error text-xs pt-3">
                  {(thumbnailQuery.error as Error).message}
                </Typography>
              ) : null}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: tables + open-with */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">

          {/* Metadata tables */}
          {metadata ? (
            <div className="flex flex-wrap gap-6 h-fit">
              <ZarrMetadataTable
                arr={metadata.arr}
                multiscale={metadata.multiscale}
                shapes={metadata.shapes}
                zarrVersion={metadata.zarrVersion}
              />
            </div>
          ) : root.path !== '' ? (
            <Typography className="text-sm text-foreground/70">
              Zarr {root.version} at <code>{root.path}/</code>
              {ozx.isOzx
                ? ` · RFC-9 OZX${ozx.omeVersion ? ` ${ozx.omeVersion}` : ''}`
                : ''}
            </Typography>
          ) : null}

          {/* Open with + source URL */}
          <div className="flex items-start gap-8">
            {/* Open with */}
            <div className="flex flex-col gap-1 shrink-0">
              <Typography className="font-semibold text-sm text-surface-foreground">
                Open with:
              </Typography>
              <div className="flex gap-2 items-start">
                <div className="flex flex-col items-center w-16">
                  <Tooltip>
                    <Tooltip.Trigger as="div">
                      <a
                        className={CIRCLE_CLASSES}
                        href={neuroglancerUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <img
                          alt="Neuroglancer logo"
                          className="max-h-7 max-w-7 rounded-sm"
                          src={neuroglancer_logo}
                        />
                      </a>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      View in Neuroglancer
                      <Tooltip.Arrow />
                    </Tooltip.Content>
                  </Tooltip>
                  <span className={LABEL_CLASSES}>Neuroglancer</span>
                </div>
              </div>
            </div>

            {/* Neuroglancer source URL */}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <Typography className="font-semibold text-sm text-surface-foreground">
                Neuroglancer Source URL
              </Typography>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 min-w-0 rounded border border-surface bg-background/80 px-2 py-1.5 font-mono text-xs text-foreground/70 focus:outline-none focus:border-primary cursor-text"
                  onClick={e => (e.target as HTMLInputElement).select()}
                  readOnly
                  type="text"
                  value={source}
                />
                <Tooltip open={copied || undefined}>
                  <Tooltip.Trigger as="div">
                    <button
                      className={`${CIRCLE_CLASSES} shrink-0`}
                      onClick={handleCopy}
                    >
                      <HiOutlineClipboardCopy className="h-5 w-5 text-foreground" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    {copied ? 'Copied!' : 'Copy source URL'}
                    <Tooltip.Arrow />
                  </Tooltip.Content>
                </Tooltip>
              </div>
            </div>
          </div>

        </div>
      </div>
      </div>
      )}
    </div>
  );
}
