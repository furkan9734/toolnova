import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

const RECENT_TOOLS_KEY = 'toolnova_recent_tools';
const FAVORITE_TOOLS_KEY = 'toolnova_favorite_tools';
const MAX_RECENT = 6;

export function useToolHistory() {
  const [recentSlugs, setRecentSlugs] = useLocalStorage<string[]>(RECENT_TOOLS_KEY, []);
  const [favoriteSlugs, setFavoriteSlugs] = useLocalStorage<string[]>(FAVORITE_TOOLS_KEY, []);

  const recordToolVisit = useCallback(
    (slug: string) => {
      setRecentSlugs((prev) => {
        const filtered = prev.filter((item) => item !== slug);
        return [slug, ...filtered].slice(0, MAX_RECENT);
      });
    },
    [setRecentSlugs]
  );

  const toggleFavorite = useCallback(
    (slug: string) => {
      setFavoriteSlugs((prev) =>
        prev.includes(slug) ? prev.filter((item) => item !== slug) : [slug, ...prev]
      );
    },
    [setFavoriteSlugs]
  );

  const isFavorite = useCallback(
    (slug: string) => favoriteSlugs.includes(slug),
    [favoriteSlugs]
  );

  const clearRecent = useCallback(() => {
    setRecentSlugs([]);
  }, [setRecentSlugs]);

  return {
    recentSlugs,
    favoriteSlugs,
    recordToolVisit,
    toggleFavorite,
    isFavorite,
    clearRecent,
  };
}
