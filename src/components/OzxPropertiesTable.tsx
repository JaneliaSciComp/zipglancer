import type { OzxInfo, ZarrRoot, ZipEntry } from '@/lib/types';
import { metadataFileFor } from '@/lib/zarrDetect';

type OzxPropertiesTableProps = {
  readonly ozx: OzxInfo;
  readonly root: ZarrRoot;
  readonly entries: ZipEntry[];
};

function YesNo({ value }: { value: boolean }) {
  return (
    <span className={value ? 'text-success' : 'text-foreground'}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

export default function OzxPropertiesTable({
  ozx,
  root,
  entries
}: OzxPropertiesTableProps) {
  // Find the first non-directory entry by central directory order.
  const firstEntry = entries.find(e => !e.isDirectory);

  // The expected metadata filename for this root (e.g. "zarr.json" or ".zattrs").
  const expectedMetaFile = metadataFileFor(root);

  const metaIsFirst =
    firstEntry !== undefined && firstEntry.name === expectedMetaFile;

  return (
    <table className="bg-background/90">
      <tbody className="text-sm">
        <tr className="h-11 border-y border-surface-dark">
          <td className="px-3 py-2 font-semibold" colSpan={2}>
            OZX Properties
          </td>
        </tr>
        <tr className="h-11 border-y border-surface-dark">
          <td className="px-3 py-2 font-semibold">ZIP Comment</td>
          <td className="px-3 py-2">
            <YesNo value={ozx.isOzx} />
            {ozx.omeVersion ? (
              <span className="text-foreground/60 ml-1">(OME {ozx.omeVersion})</span>
            ) : null}
          </td>
        </tr>
        <tr className="h-11 border-y border-surface-dark">
          <td className="px-3 py-2 font-semibold">jsonFirst</td>
          <td className="px-3 py-2">
            {ozx.isOzx ? <YesNo value={ozx.jsonFirst} /> : <span className="text-foreground/50">N/A</span>}
          </td>
        </tr>
        <tr className="h-11 border-b border-surface-dark">
          <td className="px-3 py-2 font-semibold whitespace-nowrap">
            <code className="font-mono font-normal">{expectedMetaFile}</code> first entry
          </td>
          <td className="px-3 py-2">
            <YesNo value={metaIsFirst} />
            {firstEntry && !metaIsFirst ? (
              <span className="text-foreground/50 ml-1 font-mono text-xs">
                ({firstEntry.name})
              </span>
            ) : null}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
