import { useState, useEffect, useCallback } from 'react';

export interface RouterState {
  path: string;
  navigate: (to: string) => void;
}

/**
 * Lightweight browser history router hook.
 * Handles synchronizing React state with window.location.pathname,
 * listening to popstate events for Back/Forward navigation,
 * and pushing new history entries.
 */
export const useRouter = (): RouterState => {
  const [path, setPath] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = useCallback((to: string) => {
    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to);
      setPath(to);
      window.scrollTo(0, 0);
    }
  }, []);

  return { path, navigate };
};
