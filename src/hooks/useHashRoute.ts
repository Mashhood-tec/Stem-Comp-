import { useCallback, useEffect, useState } from 'react';

export interface Route {
  path: string;
  segments: string[];
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return { path, segments: path.split('/').filter(Boolean).map(decodeURIComponent) };
}

/** Minimal hash router: survives refreshes and works on any static host. */
export function useHashRoute(): [Route, (to: string, options?: { replace?: boolean }) => void] {
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const hash = `#${to}`;
    if (window.location.hash === hash) return;
    if (options?.replace) {
      window.history.replaceState(null, '', hash);
      setRoute(parse());
      window.scrollTo({ top: 0 });
    } else {
      window.location.hash = to;
    }
  }, []);

  return [route, navigate];
}
