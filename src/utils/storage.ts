import type { Post, Story, IslandPin, TripStats } from '../types/blog';
import { calculateCurrentDay } from './dateUtils';

// Los datos del blog viven ahora en el servidor (ver api/blog.ts).
// Estas claves son las que usaba la versión antigua en localStorage: solo se
// leen para poder subir al servidor lo que ya se había creado en este navegador.
const LEGACY_KEYS = {
  POSTS: 'nusa_odyssey_posts',
  STORIES: 'nusa_odyssey_stories',
  ISLANDS: 'nusa_odyssey_islands',
};

export interface LocalBlogData {
  posts?: Post[];
  stories?: Story[];
  islandPins?: IslandPin[];
}

export const readLocalBlogData = (): LocalBlogData => {
  const read = <T>(key: string): T | undefined => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
      return undefined;
    }
  };
  return {
    posts: read<Post[]>(LEGACY_KEYS.POSTS),
    stories: read<Story[]>(LEGACY_KEYS.STORIES),
    islandPins: read<IslandPin[]>(LEGACY_KEYS.ISLANDS),
  };
};

/** Si hay fecha de inicio del viaje, el día actual se calcula siempre a partir de la fecha real. */
export const normalizeStats = (stats: TripStats): TripStats =>
  stats.tripStartDate ? { ...stats, currentDay: calculateCurrentDay(stats.tripStartDate) } : stats;

export interface BlogBackup {
  posts: Post[];
  stories: Story[];
  islandPins: IslandPin[];
  stats: TripStats;
}

export const exportAllBlogData = (data: BlogBackup) => {
  const exportData = {
    posts: data.posts,
    stories: data.stories,
    islands: data.islandPins,
    stats: data.stats,
    exportedAt: new Date().toISOString(),
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `nusa-odyssey-blog-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
