import { useEffect, useRef, useState } from 'react';
import { Switch, Typography } from '@material-tailwind/react';

import Header from '@/components/Header';
import UrlInput from '@/components/UrlInput';
import EntryList from '@/components/EntryList';
import EntryPreview from '@/components/EntryPreview';
import ZarrPreviewCard from '@/components/ZarrPreviewCard';
import SuggestedDatasets from '@/components/SuggestedDatasets';
import { useZipArchive, useOmeZarrMetadata } from '@/queries/zipQueries';
import { readAppUrlState, updateUrlState } from '@/lib/urlState';

type ExplorerProps = {
  url: string;
  initialEntry: string | null;
  initialMaximized: boolean;
  initialCollapsed: boolean;
};

function Explorer({ url, initialEntry, initialMaximized, initialCollapsed }: ExplorerProps) {
  const [selected, setSelected] = useState<{ name: string; size: number } | null>(null);
  const [maximized, setMaximized] = useState(initialMaximized);
  const [cardCollapsed, setCardCollapsed] = useState(initialCollapsed);
  const collapsedBeforeMaximize = useRef(initialCollapsed);

  const archive = useZipArchive(url);
  const omeZarr = useOmeZarrMetadata(url, archive.data?.primaryRoot ?? null);

  // Restore selected entry from URL after archive loads
  useEffect(() => {
    if (archive.data && initialEntry && !selected) {
      const entry = archive.data.zip.entries.find(e => e.name === initialEntry);
      if (entry) setSelected({ name: entry.name, size: entry.uncompressedSize });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archive.data]);

  const handleToggleMaximize = () => {
    const next = !maximized;
    if (next) {
      collapsedBeforeMaximize.current = cardCollapsed;
      setCardCollapsed(true);
      updateUrlState({ maximized: true, collapsed: true });
    } else {
      const restore = collapsedBeforeMaximize.current;
      setCardCollapsed(restore);
      updateUrlState({ maximized: false, collapsed: restore });
    }
    setMaximized(next);
  };

  const handleToggleCollapsed = () => {
    const next = !cardCollapsed;
    setCardCollapsed(next);
    updateUrlState({ collapsed: next });
  };

  const handleSelect = (entry: { name: string; uncompressedSize: number }) => {
    setSelected({ name: entry.name, size: entry.uncompressedSize });
    setMaximized(false);
    updateUrlState({ entry: entry.name, maximized: false });
  };

  const handleClose = () => {
    setSelected(null);
    setMaximized(false);
    updateUrlState({ entry: null, maximized: false });
  };

  if (archive.isLoading) {
    return <Typography className="text-foreground">Reading archive…</Typography>;
  }
  if (archive.error) {
    return (
      <Typography className="text-error">
        Failed to open archive: {(archive.error as Error).message}
      </Typography>
    );
  }
  if (!archive.data) return null;

  const { zip, ozx, primaryRoot } = archive.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {primaryRoot ? (
        <ZarrPreviewCard
          zipUrl={url}
          root={primaryRoot}
          ozx={ozx}
          metadata={omeZarr.data ?? null}
          entries={zip.entries}
          collapsed={cardCollapsed}
          onToggleCollapsed={handleToggleCollapsed}
        />
      ) : (
        <Typography className="rounded-md bg-surface-light px-3 py-2 text-sm text-foreground">
          No Zarr hierarchy detected in this archive.
        </Typography>
      )}

      <div className={`grid min-h-0 flex-1 overflow-hidden gap-3 lg:grid-rows-1 ${maximized ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {!maximized ? (
          <EntryList entries={zip.entries} onSelect={handleSelect} />
        ) : null}
        {selected ? (
          <EntryPreview
            key={selected.name}
            zip={zip}
            name={selected.name}
            uncompressedSize={selected.size}
            onClose={handleClose}
            maximized={maximized}
            onToggleMaximize={handleToggleMaximize}
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
  const initial = readAppUrlState();
  const [url, setUrl] = useState(initial.url);
  const [showSuggestions, setShowSuggestions] = useState(initial.samples);
  // Preserved across handleSubmit so that Explorer remounts with the right initial state.
  const explorerInitial = useRef({
    entry: initial.entry,
    maximized: initial.maximized,
    collapsed: initial.collapsed,
  });

  const handleSubmit = (next: string) => {
    // Reset explorer state for the new archive before remounting.
    explorerInitial.current = { entry: null, maximized: false, collapsed: false };
    setUrl(next);
    updateUrlState({ url: next, entry: null, maximized: false, collapsed: false });
  };

  const toggleSuggestions = () => {
    const next = !showSuggestions;
    setShowSuggestions(next);
    updateUrlState({ samples: next });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-3">
          <UrlInput initialUrl={url} onSubmit={handleSubmit} />
          <div className="flex items-center gap-2">
            <Switch checked={showSuggestions} onChange={toggleSuggestions} />
            <Typography
              className="text-sm text-foreground cursor-pointer select-none"
              onClick={toggleSuggestions}
            >
              Show sample datasets
            </Typography>
          </div>
          {showSuggestions ? <SuggestedDatasets onSelect={handleSubmit} /> : null}
        </div>

        {url ? (
          <Explorer
            key={url}
            url={url}
            initialEntry={explorerInitial.current.entry}
            initialMaximized={explorerInitial.current.maximized}
            initialCollapsed={explorerInitial.current.collapsed}
          />
        ) : null}
      </main>
    </div>
  );
}
