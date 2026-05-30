import { describe, it, expect } from 'vitest';

import { buildTree, flattenVisible, sortChildren } from '@/lib/entryTree';
import type { ZipEntry } from '@/lib/types';

function file(name: string, size = 100): ZipEntry {
  return { name, isDirectory: false, uncompressedSize: size, compressedSize: size };
}

function dir(name: string): ZipEntry {
  return { name: name + '/', isDirectory: true, uncompressedSize: 0, compressedSize: 0 };
}

describe('buildTree', () => {
  it('places root-level files directly under root', () => {
    const tree = buildTree([file('zarr.json'), file('README.md')]);
    const names = tree.children.map(c => c.node.name);
    expect(names).toContain('zarr.json');
    expect(names).toContain('README.md');
  });

  it('creates implicit directories for nested paths', () => {
    const tree = buildTree([file('0/zarr.json'), file('0/c/0/0')]);
    const top = tree.children.find(c => c.node.name === '0');
    expect(top?.type).toBe('dir');
    const innerNames = (top as any).node.children.map((c: any) => c.node.name);
    expect(innerNames).toContain('zarr.json');
    expect(innerNames).toContain('c');
  });

  it('handles explicit directory entries with trailing slash', () => {
    const tree = buildTree([dir('0'), file('0/zarr.json')]);
    const dirNode = tree.children.find(c => c.node.name === '0');
    expect(dirNode?.type).toBe('dir');
    // explicit dir entry is stored on the node
    expect((dirNode as any).node.entry).not.toBeNull();
  });

  it('does not create duplicate directories when both explicit and implicit', () => {
    const tree = buildTree([dir('0'), file('0/zarr.json'), file('0/c/0/0')]);
    const topDirs = tree.children.filter(c => c.node.name === '0');
    expect(topDirs).toHaveLength(1);
  });

  it('handles a Zarr v2 archive with no explicit dir entries', () => {
    const tree = buildTree([
      file('.zgroup'), file('.zattrs'), file('0/.zarray'), file('0/0.0')
    ]);
    expect(tree.children.some(c => c.node.name === '.zgroup')).toBe(true);
    expect(tree.children.some(c => c.type === 'dir' && c.node.name === '0')).toBe(true);
  });

  it('handles an empty archive', () => {
    expect(buildTree([]).children).toHaveLength(0);
  });
});

describe('sortChildren', () => {
  it('places directories before files', () => {
    const children = [
      { type: 'file' as const, node: { name: 'a.txt', path: 'a.txt', entry: file('a.txt') } },
      { type: 'dir' as const, node: { name: 'b', path: 'b', children: [], entry: null } }
    ];
    const sorted = sortChildren(children);
    expect(sorted[0].type).toBe('dir');
    expect(sorted[1].type).toBe('file');
  });

  it('sorts items of the same type alphabetically', () => {
    const children = [
      { type: 'file' as const, node: { name: 'z.json', path: 'z.json', entry: file('z.json') } },
      { type: 'file' as const, node: { name: 'a.json', path: 'a.json', entry: file('a.json') } }
    ];
    const sorted = sortChildren(children);
    expect(sorted[0].node.name).toBe('a.json');
    expect(sorted[1].node.name).toBe('z.json');
  });
});

describe('flattenVisible', () => {
  it('only shows root-level items when all dirs are collapsed', () => {
    const tree = buildTree([file('zarr.json'), file('0/zarr.json'), file('0/c/0/0')]);
    const rows = flattenVisible(tree, new Set(), 0);
    // Should see: dir '0' and file 'zarr.json' only
    expect(rows).toHaveLength(2);
    expect(rows.some(r => r.name === '0' && r.isDirectory)).toBe(true);
    expect(rows.some(r => r.name === 'zarr.json' && !r.isDirectory)).toBe(true);
  });

  it('reveals children when a directory is expanded', () => {
    const tree = buildTree([file('zarr.json'), file('0/zarr.json'), file('0/c/0/0')]);
    const rows = flattenVisible(tree, new Set(['0']), 0);
    const names = rows.map(r => r.name);
    expect(names).toContain('zarr.json'); // dir '0' content
    expect(names).toContain('c');         // implicit sub-dir
  });

  it('assigns correct depth values', () => {
    const tree = buildTree([file('alpha/beta/gamma/data.json')]);
    const rows = flattenVisible(
      tree,
      new Set(['alpha', 'alpha/beta', 'alpha/beta/gamma']),
      0
    );
    const depthByPath = Object.fromEntries(rows.map(r => [r.path, r.depth]));
    expect(depthByPath['alpha']).toBe(0);
    expect(depthByPath['alpha/beta']).toBe(1);
    expect(depthByPath['alpha/beta/gamma']).toBe(2);
    expect(depthByPath['alpha/beta/gamma/data.json']).toBe(3);
  });

  it('marks directories with children as hasChildren=true', () => {
    const tree = buildTree([file('0/zarr.json')]);
    const rows = flattenVisible(tree, new Set(), 0);
    const dirRow = rows.find(r => r.name === '0');
    expect(dirRow?.hasChildren).toBe(true);
  });

  it('marks empty directories as hasChildren=false', () => {
    const tree = buildTree([dir('empty')]);
    const rows = flattenVisible(tree, new Set(), 0);
    const dirRow = rows.find(r => r.name === 'empty');
    expect(dirRow?.hasChildren).toBe(false);
  });
});
