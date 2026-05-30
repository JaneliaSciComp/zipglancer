import type { ZipEntry } from '@/lib/types';

// ── Tree data model ──────────────────────────────────────────────────────────

export type DirNode = {
  name: string;
  path: string;
  children: TreeChild[];
  entry: ZipEntry | null;
};

export type FileNode = {
  name: string;
  path: string;
  entry: ZipEntry;
};

export type TreeChild =
  | { type: 'dir'; node: DirNode }
  | { type: 'file'; node: FileNode };

export type VisibleRow = {
  key: string;
  name: string;
  path: string;
  isDirectory: boolean;
  entry: ZipEntry | null;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
};

// ── Tree building ────────────────────────────────────────────────────────────

export function buildTree(entries: ZipEntry[]): DirNode {
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

export function sortChildren(children: TreeChild[]): TreeChild[] {
  return [...children].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.node.name.localeCompare(b.node.name);
  });
}

export function flattenVisible(
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
