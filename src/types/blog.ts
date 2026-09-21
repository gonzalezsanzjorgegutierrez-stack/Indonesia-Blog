export interface Comment {
  id: string;
  authorName: string;
  text: string;
  date: string;
  avatar?: string;
  isApproved: boolean;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  island: string;
  locationName: string;
  lat: number;
  lng: number;
  date: string;
  dayNumber: number;
  coverImage: string;
  galleryImages: string[];
  videoUrl?: string;
  excerpt: string;
  content: string;
  tags: string[];
  tips?: string[];
  highlights?: string[];
  likes: number;
  comments: Comment[];
  isFeatured?: boolean;
}

export interface Story {
  id: string;
  title: string;
  type: 'image' | 'video';
  mediaUrl: string;
  location: string;
  timestamp: string;
  likes: number;
}

export interface IslandPin {
  id: string;
  name: string;
  island: string;
  lat: number;
  lng: number;
  visitsCount: number;
  description: string;
  dates: string;
  status: 'visited' | 'current' | 'upcoming';
  coverImage?: string;
}

export interface Tip {
  id: string;
  category: 'preparacion' | 'isla' | 'viaje';
  island?: string;
  title: string;
  description: string;
  icon: string;
}

export interface TripStats {
  totalDays: number;
  currentDay: number;
  tripStartDate?: string; // ISO date (YYYY-MM-DD) - when set, currentDay is calculated automatically
  islandsVisited: number;
  photosShared: number;
  kmTravelled: number;
  startLocation?: string;
  currentLocation: string;
  nextStop: string;
  blogTitle?: string;
  authorName?: string;
}

/** Una inmersión del logbook de buceo (privado: solo se ve en Zona Pareja). */
export type DiveCurrent = 'ninguna' | 'suave' | 'moderada' | 'fuerte';

export interface Dive {
  id: string;
  number: number; // nº de inmersión en el logbook
  date: string; // YYYY-MM-DD
  timeIn?: string; // HH:MM
  site: string; // punto de buceo
  island: string; // isla / región (mismos nombres que las paradas de la ruta)
  diveCenter?: string; // centro de buceo / barco
  buddy?: string; // guía / compañero
  maxDepth?: number; // m
  avgDepth?: number; // m
  bottomTime?: number; // min
  waterTemp?: number; // °C
  visibility?: number; // m
  current?: DiveCurrent;
  gas?: 'aire' | 'nitrox';
  nitroxPct?: number;
  pressureStart?: number; // bar
  pressureEnd?: number; // bar
  weight?: number; // kg
  exposure?: string; // traje
  wildlife: string[]; // vida marina vista
  rating?: number; // 1-5
  notes?: string;
  photos: string[];
  createdAt: string;
}
