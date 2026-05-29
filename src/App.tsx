import { useState } from 'react';
import { Typography } from '@material-tailwind/react';

import Header from '@/components/Header';
import UrlInput from '@/components/UrlInput';
import EntryList from '@/components/EntryList';
import EntryPreview from '@/components/EntryPreview';
import ZarrPreviewCard from '@/components/ZarrPreviewCard';
import { useZipArchive, useOmeZarrMetadata } from '@/queries/zipQueries';

function readUrlFromLocation(): string {
  return new URLSearchParams(window.location.search).get('url') ?? '';
}

function Explorer({ url }: { url: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const archive = useZipArchive(url);
  const omeZarr = useOmeZarrMetadata(url, archive.data?.primaryRoot ?? null);

  if (archive.isLoading) {
    return (
      <Typography className="text-foreground">Reading archive…</Typography>
    );
  }
  if (archive.error) {
    return (
      <Typography className="text-error">
        Failed to open archive: {(archive.error as Error).message}
      </Typography>
    );
  }
  if (!archive.data) {
    return null;
  }

  const { zip, ozx, primaryRoot } = archive.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {primaryRoot ? (
        <ZarrPreviewCard
          zipUrl={url}
          root={primaryRoot}
          ozx={ozx}
          metadata={omeZarr.data ?? null}
        />
      ) : (
        <Typography className="rounded-md bg-surface-light px-3 py-2 text-sm text-foreground">
          No Zarr hierarchy detected in this archive.
        </Typography>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <EntryList entries={zip.entries} onSelect={setSelected} />
        {selected ? (
          <EntryPreview
            zip={zip}
            name={selected}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div className="hidden items-center justify-center rounded-md border border-dashed border-surface text-sm text-foreground lg:flex">
            Select a text or JSON entry to preview it.
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState<string>(readUrlFromLocation);

  const handleSubmit = (next: string) => {
    setUrl(next);
    const params = new URLSearchParams(window.location.search);
    params.set('url', next);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?${params.toString()}`
    );
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <UrlInput initialUrl={url} onSubmit={handleSubmit} />
        {url ? (
          <Explorer key={url} url={url} />
        ) : (
          <Typography className="text-foreground">
            Enter the URL of a <code>.zip</code> or <code>.ozx</code> file, or
            open zipglancer with a <code>?url=</code> query parameter from
            fileglancer.
          </Typography>
        )}
      </main>
    </div>
  );
}
