import { useEffect, useState } from 'react';
import { Button, Input, Typography } from '@material-tailwind/react';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';

type UrlInputProps = {
  readonly initialUrl: string;
  readonly onSubmit: (url: string) => void;
};

export default function UrlInput({ initialUrl, onSubmit }: UrlInputProps) {
  const [value, setValue] = useState(initialUrl);

  useEffect(() => {
    setValue(initialUrl);
  }, [initialUrl]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-1">
      <Typography
        as="label"
        htmlFor="zip-url"
        className="text-sm font-medium text-surface-foreground"
      >
        ZIP / OZX file URL
      </Typography>
      <div className="flex gap-2">
        <Input
          id="zip-url"
          type="url"
          placeholder="https://example.org/data.ozx"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" className="flex items-center gap-1">
          <HiOutlineMagnifyingGlass className="h-4 w-4" />
          Open
        </Button>
      </div>
    </form>
  );
}
