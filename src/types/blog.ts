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

export interface TripStats {
  totalDays: number;
  currentDay: number;
  islandsVisited: number;
  photosShared: number;
  kmTravelled: number;
  currentLocation: string;
  nextStop: string;
  blogTitle?: string;
  authorName?: string;
}
