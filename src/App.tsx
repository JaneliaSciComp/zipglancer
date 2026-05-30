import { useState } from 'react';
import { Switch, Typography } from '@material-tailwind/react';

import Header from '@/components/Header';
import UrlInput from '@/components/UrlInput';
import EntryList from '@/components/EntryList';
import EntryPreview from '@/components/EntryPreview';
import ZarrPreviewCard from '@/components/ZarrPreviewCard';
import SuggestedDatasets from '@/components/SuggestedDatasets';
import { useZipArchive, useOmeZarrMetadata } from '@/queries/zipQueries';

const SUGGESTIONS_KEY = 'zipglancer:showSuggestions';

function readUrlFromLocation(): string {
  return new URLSearchParams(window.location.search).get('url') ?? '';
}

function readShowSuggestions(): boolean {
  const stored = localStorage.getItem(SUGGESTIONS_KEY);
  // Default is false; the user has explicitly enabled it for this session.
  return stored === null ? false : stored === 'true';
}

function Explorer({ url }: { url: string }) {
  const [selected, setSelected] = useState<{ name: string; size: number } | null>(null);
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
        <EntryList
          entries={zip.entries}
          onSelect={entry => setSelected({ name: entry.name, size: entry.uncompressedSize })}
        />
        {selected ? (
          <EntryPreview
            key={selected.name}
            zip={zip}
            name={selected.name}
            uncompressedSize={selected.size}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div className="hidden items-center justify-center rounded-md border border-dashed border-surface text-sm text-foreground lg:flex">
            Select any entry to preview it.
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState<string>(readUrlFromLocation);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(readShowSuggestions);

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

  const toggleSuggestions = () => {
    const next = !showSuggestions;
    setShowSuggestions(next);
    localStorage.setItem(SUGGESTIONS_KEY, String(next));
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-3">
          <UrlInput initialUrl={url} onSubmit={handleSubmit} />
          <div className="flex items-center gap-2">
            <Switch
              checked={showSuggestions}
              onChange={toggleSuggestions}
            />
            <Typography
              className="text-sm text-foreground cursor-pointer select-none"
              onClick={toggleSuggestions}
            >
              Show sample datasets
            </Typography>
          </div>
          {showSuggestions ? (
            <SuggestedDatasets onSelect={handleSubmit} />
          ) : null}
        </div>

        {url ? (
          <Explorer key={url} url={url} />
        ) : null}
      </main>
    </div>
  );
}
