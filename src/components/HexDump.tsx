import { Typography } from '@material-tailwind/react';

const BYTES_PER_ROW = 16;

function toPrintable(byte: number): string {
  return byte >= 0x20 && byte < 0x7f ? String.fromCharCode(byte) : '.';
}

type HexDumpProps = {
  readonly bytes: Uint8Array;
  readonly totalFileSize?: number;
};

export default function HexDump({ bytes, totalFileSize }: HexDumpProps) {
  const rows: string[] = [];

  for (let offset = 0; offset < bytes.length; offset += BYTES_PER_ROW) {
    const chunk = bytes.slice(offset, offset + BYTES_PER_ROW);
    const offsetStr = offset.toString(16).padStart(4, '0').toUpperCase();
    const hexParts: string[] = [];
    for (let i = 0; i < BYTES_PER_ROW; i++) {
      if (i === 8) hexParts.push(' ');
      hexParts.push(
        i < chunk.length
          ? chunk[i].toString(16).padStart(2, '0').toUpperCase()
          : '  '
      );
    }
    const hexStr = hexParts.join(' ');
    const asciiStr = Array.from(chunk).map(toPrintable).join('');
    rows.push(`${offsetStr}:  ${hexStr}  ${asciiStr}`);
  }

  const isTruncated = totalFileSize !== undefined && totalFileSize > bytes.length;

  return (
    <div className="p-4">
      {isTruncated ? (
        <Typography className="text-xs text-foreground/60 mb-2">
          Showing first {bytes.length} of {totalFileSize.toLocaleString()} bytes
        </Typography>
      ) : (
        <Typography className="text-xs text-foreground/60 mb-2">
          {bytes.length} bytes
        </Typography>
      )}
      <pre className="text-xs font-mono text-foreground leading-5 whitespace-pre overflow-x-auto">
        {rows.join('\n')}
      </pre>
    </div>
  );
}
