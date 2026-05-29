import { Typography } from '@material-tailwind/react';

export default function Header() {
  return (
    <header className="flex items-center gap-3 border-b border-surface px-5 py-3 bg-background">
      <img src="./logo.svg" alt="Zipglancer logo" className="h-8 w-8" />
      <div className="flex flex-col">
        <Typography className="font-bold text-lg text-surface-foreground leading-tight">
          Zipglancer
        </Typography>
        <Typography className="text-xs text-foreground leading-tight">
          Explore ZIP and OME-Zarr (RFC-9 OZX) archives on the web
        </Typography>
      </div>
    </header>
  );
}
