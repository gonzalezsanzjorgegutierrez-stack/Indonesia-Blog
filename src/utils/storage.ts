import type { Post, Story, IslandPin, TripStats } from '../types/blog';
import { initialPosts, initialStories, initialIslandPins, initialStats } from '../data/initialData';

const KEYS = {
  POSTS: 'nusa_odyssey_posts',
  STORIES: 'nusa_odyssey_stories',
  ISLANDS: 'nusa_odyssey_islands',
  STATS: 'nusa_odyssey_stats',
  ADMIN_PIN: 'nusa_odyssey_admin_pin',
};

// Default Admin PIN for the couple
export const DEFAULT_ADMIN_PIN = '8614';


export const getStoredPosts = (): Post[] => {
  try {
    const stored = localStorage.getItem(KEYS.POSTS);
    return stored ? JSON.parse(stored) : initialPosts;
  } catch (e) {
    console.error('Error loading posts from storage', e);
    return initialPosts;
  }
};

export const savePosts = (posts: Post[]): void => {
  localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
};

export const getStoredStories = (): Story[] => {
  try {
    const stored = localStorage.getItem(KEYS.STORIES);
    return stored ? JSON.parse(stored) : initialStories;
  } catch (e) {
    return initialStories;
  }
};

export const saveStories = (stories: Story[]): void => {
  localStorage.setItem(KEYS.STORIES, JSON.stringify(stories));
};

export const getStoredIslandPins = (): IslandPin[] => {
  try {
    const stored = localStorage.getItem(KEYS.ISLANDS);
    return stored ? JSON.parse(stored) : initialIslandPins;
  } catch (e) {
    return initialIslandPins;
  }
};

export const saveIslandPins = (pins: IslandPin[]): void => {
  localStorage.setItem(KEYS.ISLANDS, JSON.stringify(pins));
};

export const getStoredStats = (): TripStats => {
  try {
    const stored = localStorage.getItem(KEYS.STATS);
    return stored ? JSON.parse(stored) : initialStats;
  } catch (e) {
    return initialStats;
  }
};

export const saveStats = (stats: TripStats): void => {
  localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
};

export const getAdminPin = (): string => {
  return localStorage.getItem(KEYS.ADMIN_PIN) || DEFAULT_ADMIN_PIN;
};

export const saveAdminPin = (pin: string): void => {
  localStorage.setItem(KEYS.ADMIN_PIN, pin);
};

export const exportAllBlogData = () => {
  const exportData = {
    posts: getStoredPosts(),
    stories: getStoredStories(),
    islands: getStoredIslandPins(),
    stats: getStoredStats(),
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

export const importBlogData = (jsonData: string): boolean => {
  try {
    const parsed = JSON.parse(jsonData);
    if (parsed.posts) savePosts(parsed.posts);
    if (parsed.stories) saveStories(parsed.stories);
    if (parsed.islands) saveIslandPins(parsed.islands);
    if (parsed.stats) saveStats(parsed.stats);
    return true;
  } catch (e) {
    console.error('Failed to import blog data', e);
    return false;
  }
};

export const resetToDemoData = () => {
  localStorage.removeItem(KEYS.POSTS);
  localStorage.removeItem(KEYS.STORIES);
  localStorage.removeItem(KEYS.ISLANDS);
  localStorage.removeItem(KEYS.STATS);
};
