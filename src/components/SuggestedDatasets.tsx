import { useState } from 'react';
import { Typography } from '@material-tailwind/react';
import { HiOutlineMagnifyingGlass, HiArrowTopRightOnSquare } from 'react-icons/hi2';

import DATASETS from '@/data/sciVisDatasets';
import type { SciVisDataset } from '@/data/sciVisDatasets';

type SuggestedDatasetsProps = {
  readonly onSelect: (url: string) => void;
};

export default function SuggestedDatasets({ onSelect }: SuggestedDatasetsProps) {
  const [filter, setFilter] = useState('');

  const filtered = filter.trim()
    ? DATASETS.filter(
        d =>
          d.name.includes(filter.toLowerCase()) ||
          d.description.toLowerCase().includes(filter.toLowerCase())
      )
    : DATASETS;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Typography className="font-semibold text-sm text-surface-foreground">
          OME-Zarr Open SciVis Datasets ({filtered.length} of {DATASETS.length})
        </Typography>
        <a
          className="text-xs text-primary hover:underline flex items-center gap-1"
          href="https://github.com/InsightSoftwareConsortium/OMEZarrOpenSciVisDatasets"
          rel="noopener noreferrer"
          target="_blank"
        >
          View on GitHub
          <HiArrowTopRightOnSquare className="h-3 w-3" />
        </a>
      </div>

      {/* Filter */}
      <div className="relative">
        <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/50" />
        <input
          className="w-full rounded border border-surface bg-background pl-7 pr-3 py-1.5 text-sm text-surface-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none"
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter datasets…"
          type="text"
          value={filter}
        />
      </div>

      {/* Dataset list */}
      <div className="overflow-y-auto rounded-md border border-surface max-h-64">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-surface-light">
            <tr className="text-left text-foreground border-b border-surface">
              <th className="px-3 py-2 font-semibold w-40">Name</th>
              <th className="px-3 py-2 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((dataset: SciVisDataset) => (
              <tr
                className="border-t border-surface cursor-pointer hover:bg-hover-gradient"
                key={dataset.name}
                onClick={() => onSelect(dataset.url)}
                title={dataset.url}
              >
                <td className="px-3 py-1.5 font-mono text-surface-foreground whitespace-nowrap">
                  {dataset.name}
                </td>
                <td className="px-3 py-1.5 text-foreground truncate max-w-xs">
                  {dataset.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
