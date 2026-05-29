import { useMemo, useState } from 'react';
import { Typography } from '@material-tailwind/react';
import {
  HiOutlineFolder,
  HiOutlineDocument,
  HiChevronUp,
  HiChevronDown
} from 'react-icons/hi2';

import { formatBytes, isTextLikeEntry } from '@/lib/format';
import type { ZipEntry } from '@/lib/types';

type SortKey = 'name' | 'size';
type SortDir = 'asc' | 'desc';

type EntryListProps = {
  readonly entries: ZipEntry[];
  readonly onSelect: (name: string) => void;
};

export default function EntryList({ entries, onSelect }: EntryListProps) {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? entries.filter(e => e.name.toLowerCase().includes(needle))
      : entries;
    const sign = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'size') {
        return sign * (a.uncompressedSize - b.uncompressedSize);
      }
      return sign * a.name.localeCompare(b.name);
    });
  }, [entries, filter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ active }: { active: boolean }) =>
    !active ? null : sortDir === 'asc' ? (
      <HiChevronUp className="inline h-3 w-3" />
    ) : (
      <HiChevronDown className="inline h-3 w-3" />
    );

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 py-2">
        <Typography className="font-semibold text-surface-foreground">
          Contents ({entries.length})
        </Typography>
        <input
          type="text"
          placeholder="Filter…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded border border-surface bg-background px-2 py-1 text-sm text-surface-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-surface">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-surface-light">
            <tr className="text-left text-foreground">
              <th
                className="cursor-pointer px-3 py-2 font-medium"
                onClick={() => toggleSort('name')}
              >
                Name <SortIcon active={sortKey === 'name'} />
              </th>
              <th
                className="cursor-pointer px-3 py-2 text-right font-medium"
                onClick={() => toggleSort('size')}
              >
                Size <SortIcon active={sortKey === 'size'} />
              </th>
              <th className="px-3 py-2 text-right font-medium">Compressed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(entry => {
              const clickable = !entry.isDirectory && isTextLikeEntry(entry.name);
              return (
                <tr
                  key={entry.name}
                  className={`border-t border-surface ${
                    clickable
                      ? 'cursor-pointer hover:bg-hover-gradient'
                      : ''
                  }`}
                  onClick={clickable ? () => onSelect(entry.name) : undefined}
                >
                  <td className="px-3 py-1.5 text-surface-foreground">
                    <span className="flex items-center gap-2 font-mono">
                      {entry.isDirectory ? (
                        <HiOutlineFolder className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <HiOutlineDocument className="h-4 w-4 shrink-0 text-foreground" />
                      )}
                      {entry.name}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right text-foreground">
                    {entry.isDirectory ? '—' : formatBytes(entry.uncompressedSize)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-foreground">
                    {entry.isDirectory ? '—' : formatBytes(entry.compressedSize)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
