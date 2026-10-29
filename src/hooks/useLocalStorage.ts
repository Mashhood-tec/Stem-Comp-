import { useCallback, useEffect, useRef, useState } from 'react';
import { readStored, removeStored, writeStored } from '../utils/persistence';

type SetValue<T> = (value: T | ((previous: T) => T)) => void;

/** State that is loaded from and saved to localStorage, with validation of stored data. */
export function useLocalStorage<T>(
  key: string,
  load: () => T,
  options: { removeWhen?: (value: T) => boolean } = {},
): [T, SetValue<T>] {
  const [value, setValue] = useState<T>(load);
  const removeWhen = useRef(options.removeWhen);
  removeWhen.current = options.removeWhen;

  useEffect(() => {
    if (removeWhen.current?.(value)) removeStored(key);
    else writeStored(key, value);
  }, [key, value]);

  const set = useCallback<SetValue<T>>((next) => setValue(next), []);
  return [value, set];
}

export function loadValidated<T>(key: string, validate: (value: unknown) => value is T, fallback: T): () => T {
  return () => readStored(key, validate, fallback);
}
