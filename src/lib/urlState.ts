export type AppUrlState = {
  url: string;
  entry: string | null;
  maximized: boolean;
  collapsed: boolean;
  samples: boolean;
};

export function readAppUrlState(): AppUrlState {
  const params = new URLSearchParams(window.location.search);
  return {
    url: params.get('url') ?? '',
    entry: params.get('entry'),
    maximized: params.has('maximized'),
    collapsed: params.has('collapsed'),
    samples: params.has('samples'),
  };
}

// Falsy values (false, null, '', undefined) remove the param; true sets it to '1'; strings set as-is.
export function updateUrlState(updates: Partial<AppUrlState>): void {
  const params = new URLSearchParams(window.location.search);
  for (const [key, val] of Object.entries(updates)) {
    if (!val) {
      params.delete(key);
    } else if (val === true) {
      params.set(key, '1');
    } else {
      params.set(key, val as string);
    }
  }
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
}
