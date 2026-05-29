import { useQuery } from '@tanstack/react-query';
import { Typography } from '@material-tailwind/react';
import { HiXMark } from 'react-icons/hi2';

import type { OpenedZip } from '@/lib/zipReader';

type EntryPreviewProps = {
  readonly zip: OpenedZip;
  readonly name: string;
  readonly onClose: () => void;
};

function prettyText(name: string, text: string): string {
  const lower = name.toLowerCase();
  const isJson =
    lower.endsWith('.json') ||
    name.endsWith('.zattrs') ||
    name.endsWith('.zgroup') ||
    name.endsWith('.zarray');
  if (isJson) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }
  return text;
}

export default function EntryPreview({ zip, name, onClose }: EntryPreviewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['zip-entry', zip.url, name],
    queryFn: async () => prettyText(name, await zip.readText(name))
  });

  return (
    <div className="flex h-full flex-col rounded-md border border-surface bg-background">
      <div className="flex items-center justify-between border-b border-surface px-3 py-2">
        <Typography className="truncate font-mono text-sm text-surface-foreground">
          {name}
        </Typography>
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="rounded p-1 text-foreground hover:bg-surface-light"
        >
          <HiXMark className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {isLoading ? (
          <Typography className="text-sm text-foreground">Loading…</Typography>
        ) : error ? (
          <Typography className="text-sm text-error">
            Failed to read entry: {(error as Error).message}
          </Typography>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-xs text-surface-foreground">
            {data}
          </pre>
        )}
      </div>
    </div>
  );
}
