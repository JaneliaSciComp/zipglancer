import { useMemo, useState } from 'react';
import { Typography, Tooltip } from '@material-tailwind/react';
import { HiFolder, HiChevronRight, HiChevronDown, HiArrowDownTray, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { TbFile } from 'react-icons/tb';

import { formatBytes } from '@/lib/format';
import type { ZipEntry } from '@/lib/types';
import {
  buildTree,
  flattenVisible,
  type DirNode,
  type VisibleRow
} from '@/lib/entryTree';

function initialExpanded(_root: DirNode): Set<string> {
  return new Set();
}

// ── Component ────────────────────────────────────────────────────────────────

type EntryListProps = {
  readonly entries: ZipEntry[];
  readonly onSelect: (entry: ZipEntry) => void;
  readonly onDownload?: (entry: ZipEntry) => Promise<void>;
};

export default function EntryList({ entries, onSelect, onDownload }: EntryListProps) {
  const tree = useMemo(() => buildTree(entries), [entries]);
  const [expanded, setExpanded] = useState<Set<string>>(() => initialExpanded(tree));
  const [filter, setFilter] = useState('');
  const [downloading, setDownloading] = useState<Set<string>>(new Set());

  const handleDownload = async (e: React.MouseEvent, entry: ZipEntry) => {
    e.stopPropagation();
    if (!onDownload || downloading.has(entry.name)) return;
    setDownloading(prev => new Set(prev).add(entry.name));
    try {
      await onDownload(entry);
    } finally {
      setDownloading(prev => {
        const next = new Set(prev);
        next.delete(entry.name);
        return next;
      });
    }
  };

  const toggle = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // When filtering, show a flat list of all matching non-directory entries.
  const needle = filter.trim().toLowerCase();
  const rows: VisibleRow[] = useMemo(() => {
    if (needle) {
      return entries
        .filter(e => !e.isDirectory && e.name.toLowerCase().includes(needle))
        .map(e => ({
          key: e.name,
          name: e.name,
          path: e.name,
          isDirectory: false,
          entry: e,
          depth: 0,
          hasChildren: false,
          isExpanded: false
        }));
    }
    return flattenVisible(tree, expanded, 0);
  }, [needle, entries, tree, expanded]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 py-2">
        <Typography className="font-semibold text-surface-foreground">
          Contents ({entries.filter(e => !e.isDirectory).length} files)
        </Typography>
        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/50" />
          <input
            type="text"
            placeholder="Filter…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="rounded border border-surface bg-background pl-7 pr-2 py-1 text-sm text-surface-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-surface">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-surface-light">
            <tr className="text-left text-foreground">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 text-right font-medium">Size</th>
              <th className="px-3 py-2 text-right font-medium">Compressed</th>
              {onDownload ? <th className="px-2 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isClickable = !row.isDirectory;
              const indent = row.depth * 1.25;
              return (
                <tr
                  key={row.key}
                  className={`border-t border-surface ${isClickable ? 'cursor-pointer hover:bg-hover-gradient' : ''}`}
                  onClick={
                    row.isDirectory
                      ? () => toggle(row.path)
                      : row.entry
                        ? () => onSelect(row.entry!)
                        : undefined
                  }
                >
                  <td className="px-3 py-1.5 text-surface-foreground">
                    <span
                      className="flex items-center gap-1.5 font-mono"
                      style={{ paddingLeft: `${indent}rem` }}
                    >
                      {row.isDirectory ? (
                        <>
                          <span className="text-foreground/50 w-3.5 shrink-0">
                            {row.hasChildren ? (
                              row.isExpanded ? (
                                <HiChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <HiChevronRight className="h-3.5 w-3.5" />
                              )
                            ) : null}
                          </span>
                          <HiFolder className="h-5 w-5 shrink-0 text-foreground" />
                        </>
                      ) : (
                        <>
                          <span className="w-3.5 shrink-0" />
                          <TbFile className="h-4 w-4 shrink-0 text-foreground" />
                        </>
                      )}
                      {row.name}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right text-foreground">
                    {row.isDirectory || !row.entry
                      ? '—'
                      : formatBytes(row.entry.uncompressedSize)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-foreground">
                    {row.isDirectory || !row.entry
                      ? '—'
                      : formatBytes(row.entry.compressedSize)}
                  </td>
                  {onDownload ? (
                    <td className="px-2 py-1.5">
                      {!row.isDirectory && row.entry ? (
                        <Tooltip>
                          <Tooltip.Trigger as="div">
                            <button
                              className="flex items-center justify-center rounded p-1 text-foreground/60 hover:bg-surface hover:text-foreground disabled:opacity-40"
                              disabled={downloading.has(row.entry.name)}
                              onClick={e => handleDownload(e, row.entry!)}
                              aria-label="Download"
                            >
                              {downloading.has(row.entry.name) ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
                              ) : (
                                <HiArrowDownTray className="h-4 w-4" />
                              )}
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Content>
                            Download
                            <Tooltip.Arrow />
                          </Tooltip.Content>
                        </Tooltip>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
