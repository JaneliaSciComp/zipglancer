import { useMemo, useState } from 'react';
import { Typography } from '@material-tailwind/react';
import { HiFolder, HiChevronRight, HiChevronDown } from 'react-icons/hi2';
import { TbFile } from 'react-icons/tb';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';

import { formatBytes } from '@/lib/format';
import type { ZipEntry } from '@/lib/types';

// ── Tree data model ──────────────────────────────────────────────────────────

type DirNode = {
  name: string;
  path: string;
  children: TreeChild[];
  entry: ZipEntry | null;
};

type FileNode = {
  name: string;
  path: string;
  entry: ZipEntry;
};

type TreeChild =
  | { type: 'dir'; node: DirNode }
  | { type: 'file'; node: FileNode };

function buildTree(entries: ZipEntry[]): DirNode {
  const root: DirNode = { name: '', path: '', children: [], entry: null };
  const dirs = new Map<string, DirNode>([['', root]]);

  const ensureDir = (path: string): DirNode => {
    if (dirs.has(path)) return dirs.get(path)!;
    const slash = path.lastIndexOf('/');
    const parentPath = slash >= 0 ? path.slice(0, slash) : '';
    const name = slash >= 0 ? path.slice(slash + 1) : path;
    const node: DirNode = { name, path, children: [], entry: null };
    dirs.set(path, node);
    const parent = ensureDir(parentPath);
    parent.children.push({ type: 'dir', node });
    return node;
  };

  for (const entry of entries) {
    const normalized = entry.name.replace(/\/$/, '');
    if (entry.isDirectory) {
      const node = ensureDir(normalized);
      node.entry = entry;
    } else {
      const slash = normalized.lastIndexOf('/');
      const parentPath = slash >= 0 ? normalized.slice(0, slash) : '';
      const name = slash >= 0 ? normalized.slice(slash + 1) : normalized;
      const parent = ensureDir(parentPath);
      parent.children.push({ type: 'file', node: { name, path: normalized, entry } });
    }
  }

  return root;
}

function sortChildren(children: TreeChild[]): TreeChild[] {
  return [...children].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.node.name.localeCompare(b.node.name);
  });
}

// ── Visible row model ────────────────────────────────────────────────────────

type VisibleRow = {
  key: string;
  name: string;
  path: string;
  isDirectory: boolean;
  entry: ZipEntry | null;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
};

function flattenVisible(
  node: DirNode,
  expanded: Set<string>,
  depth: number,
  result: VisibleRow[] = []
): VisibleRow[] {
  for (const child of sortChildren(node.children)) {
    if (child.type === 'dir') {
      const isExpanded = expanded.has(child.node.path);
      result.push({
        key: child.node.path || '/',
        name: child.node.name,
        path: child.node.path,
        isDirectory: true,
        entry: child.node.entry,
        depth,
        hasChildren: child.node.children.length > 0,
        isExpanded
      });
      if (isExpanded) {
        flattenVisible(child.node, expanded, depth + 1, result);
      }
    } else {
      result.push({
        key: child.node.path,
        name: child.node.name,
        path: child.node.path,
        isDirectory: false,
        entry: child.node.entry,
        depth,
        hasChildren: false,
        isExpanded: false
      });
    }
  }
  return result;
}

function initialExpanded(_root: DirNode): Set<string> {
  return new Set();
}

// ── Component ────────────────────────────────────────────────────────────────

type EntryListProps = {
  readonly entries: ZipEntry[];
  readonly onSelect: (entry: ZipEntry) => void;
};

export default function EntryList({ entries, onSelect }: EntryListProps) {
  const tree = useMemo(() => buildTree(entries), [entries]);
  const [expanded, setExpanded] = useState<Set<string>>(() => initialExpanded(tree));
  const [filter, setFilter] = useState('');

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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
