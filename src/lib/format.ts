/** Human-readable byte size, e.g. 1536 -> "1.5 KB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** File extensions worth previewing inline as text. */
const TEXT_EXTENSIONS = new Set([
  'json',
  'txt',
  'md',
  'csv',
  'tsv',
  'yaml',
  'yml',
  'xml',
  'log',
  'zattrs',
  'zgroup',
  'zarray'
]);

export function isTextLikeEntry(name: string): boolean {
  const base = name.split('/').pop() ?? name;
  if (base === '.zattrs' || base === '.zgroup' || base === '.zarray') {
    return true;
  }
  const ext = base.includes('.') ? base.split('.').pop()! : '';
  return TEXT_EXTENSIONS.has(ext.toLowerCase());
}
