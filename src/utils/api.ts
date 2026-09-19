import type { Post, Story, IslandPin, TripStats, Comment } from '../types/blog';

const ENDPOINT = '/api/blog';

export interface RemoteData {
  posts: Post[] | null;
  stories: Story[] | null;
  islandPins: IslandPin[] | null;
  stats: TripStats | null;
  likes: Record<string, number>;
  comments: Record<string, Comment[]>;
}

export type ListKey = 'posts' | 'stories';
export type DataKey = ListKey | 'islandPins' | 'stats';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

async function call<T>(body: Record<string, unknown>, pin?: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(pin ? { 'x-admin-pin': pin } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return { ok: false, status: res.status, error: data.error ?? `Error ${res.status}` };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, status: 0, error: 'Sin conexión con el servidor' };
  }
}

/** Lee todos los datos compartidos. Devuelve null si el servidor no responde. */
export async function fetchRemoteData(): Promise<RemoteData | null> {
  try {
    const res = await fetch(ENDPOINT, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as RemoteData;
  } catch {
    return null;
  }
}

export type LoginResult = 'ok' | 'wrong' | 'blocked' | 'error';

export async function verifyPin(pin: string): Promise<LoginResult> {
  const result = await call<{ ok: true }>({ action: 'verify', pin });
  if (result.ok) return 'ok';
  if (result.status === 401) return 'wrong';
  if (result.status === 429) return 'blocked';
  return 'error';
}

export const saveData = (key: DataKey, value: unknown, pin: string) =>
  call<{ ok: true }>({ action: 'save', key, value }, pin);

export const upsertItem = <T>(key: ListKey, item: T, pin: string) =>
  call<{ items: T[] }>({ action: 'upsert', key, item }, pin);

export const removeItem = <T>(key: ListKey, id: string, pin: string) =>
  call<{ items: T[] }>({ action: 'remove', key, id }, pin);

export const likePost = (postId: string) =>
  call<{ likes: number }>({ action: 'like', postId });

export const addComment = (postId: string, authorName: string, text: string) =>
  call<{ comment: Comment }>({ action: 'comment', postId, authorName, text });

export const deleteComment = (postId: string, commentId: string, pin: string) =>
  call<{ ok: true }>({ action: 'deleteComment', postId, commentId }, pin);

export const uploadImage = (image: string, pin: string) =>
  call<{ url: string }>({ action: 'upload', image }, pin);
