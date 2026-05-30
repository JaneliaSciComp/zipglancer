import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Switch, Typography } from '@material-tailwind/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  materialDark,
  coy
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Formatter } from 'fracturedjsonjs';
import { HiXMark, HiArrowsPointingOut, HiArrowsPointingIn } from 'react-icons/hi2';

import HexDump from '@/components/HexDump';
import useDarkMode from '@/hooks/useDarkMode';
import { isBinaryEntry } from '@/lib/format';
import type { OpenedZip } from '@/lib/zipReader';

const BINARY_PREVIEW_BYTES = 512;

const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  py: 'python', json: 'json', zattrs: 'json', zarray: 'json', zgroup: 'json',
  yml: 'yaml', yaml: 'yaml', xml: 'xml', html: 'html', css: 'css',
  md: 'markdown', sh: 'bash', bash: 'bash', sql: 'sql', java: 'java',
  c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', rs: 'rust', go: 'go',
  rb: 'ruby', toml: 'toml', ini: 'ini', cfg: 'ini', conf: 'ini'
};

function getLanguage(name: string): string {
  const base = name.split('/').pop() ?? name;
  if (base === '.zattrs' || base === '.zgroup' || base === '.zarray') return 'json';
  const ext = base.includes('.') ? base.split('.').pop()!.toLowerCase() : '';
  return LANGUAGE_MAP[ext] ?? 'text';
}

type EntryPreviewProps = {
  readonly zip: OpenedZip;
  readonly name: string;
  readonly uncompressedSize: number;
  readonly onClose: () => void;
  readonly maximized?: boolean;
  readonly onToggleMaximize?: () => void;
};

export default function EntryPreview({
  zip,
  name,
  uncompressedSize,
  onClose,
  maximized = false,
  onToggleMaximize
}: EntryPreviewProps) {
  const isDarkMode = useDarkMode();
  const [formatJson, setFormatJson] = useState(true);
  const binary = isBinaryEntry(name);
  const language = getLanguage(name);
  const isJson = language === 'json';

  const { data, isLoading, error } = useQuery({
    queryKey: ['zip-entry', zip.url, name, binary],
    queryFn: async (): Promise<string | Uint8Array> => {
      if (binary) {
        const bytes = await zip.readBytes(name);
        return bytes.slice(0, BINARY_PREVIEW_BYTES);
      }
      return zip.readText(name);
    }
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <Typography className="p-4 text-foreground">Loading…</Typography>
      );
    }
    if (error) {
      return (
        <Typography className="p-4 text-error">
          {(error as Error).message}
        </Typography>
      );
    }

    if (binary) {
      return (
        <HexDump
          bytes={data as Uint8Array}
          totalFileSize={uncompressedSize}
        />
      );
    }

    let content = data as string;
    if (isJson && formatJson && content) {
      try {
        const formatter = new Formatter();
        formatter.Options.IndentSpaces = 2;
        formatter.Options.MaxTableRowComplexity = 1;
        content = formatter.Serialize(JSON.parse(content)) ?? content;
      } catch {
        // leave as-is
      }
    }

    const theme = isDarkMode ? materialDark : coy;
    const themeCodeStyles =
      (theme as any)['code[class*="language-"]'] || {};

    return (
      <SyntaxHighlighter
        codeTagProps={{
          style: { ...themeCodeStyles, paddingBottom: '2em', background: 'transparent' }
        }}
        customStyle={{
          margin: 0,
          padding: '1em',
          paddingBottom: 0,
          fontSize: '13px',
          lineHeight: '1.5',
          overflow: 'hidden',
          background: 'transparent'
        }}
        language={language}
        showLineNumbers={false}
        style={isDarkMode ? materialDark : coy}
        wrapLines={true}
        wrapLongLines={true}
      >
        {content}
      </SyntaxHighlighter>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-md border border-surface bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface px-3 py-2 bg-surface-light shrink-0">
        <Typography className="truncate font-mono text-sm text-surface-foreground">
          {name}
        </Typography>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          {isJson && !binary ? (
            <div className="flex items-center gap-2">
              <Typography className="text-foreground text-sm whitespace-nowrap">
                Format JSON
              </Typography>
              <Switch
                checked={formatJson}
                onChange={() => setFormatJson(f => !f)}
              />
            </div>
          ) : null}
          {onToggleMaximize ? (
            <button
              aria-label={maximized ? 'Restore' : 'Maximize'}
              className="rounded p-1 text-foreground hover:bg-surface"
              onClick={onToggleMaximize}
              title={maximized ? 'Restore' : 'Maximize'}
            >
              {maximized
                ? <HiArrowsPointingIn className="h-5 w-5" />
                : <HiArrowsPointingOut className="h-5 w-5" />}
            </button>
          ) : null}
          <button
            aria-label="Close preview"
            className="rounded p-1 text-foreground hover:bg-surface"
            onClick={onClose}
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}
