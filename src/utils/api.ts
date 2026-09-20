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

async function call<T>(body: Record<string, unknown>, token?: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // La credencial (llave de sesión) va en el cuerpo, no en una cabecera: ver requireAdmin en api/blog.ts
      body: JSON.stringify(token ? { ...body, token } : body),
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

/** Entra con la contraseña. Si es correcta, el servidor devuelve la llave de sesión de este dispositivo. */
export async function login(pin: string): Promise<{ result: LoginResult; token: string | null }> {
  const r = await call<{ ok: true; token: string }>({ action: 'verify', pin });
  if (r.ok) return { result: 'ok', token: r.data.token };
  if (r.status === 401) return { result: 'wrong', token: null };
  if (r.status === 429) return { result: 'blocked', token: null };
  return { result: 'error', token: null };
}

/** ¿Sigue valiendo la llave guardada? `unknown` = no se pudo comprobar (sin conexión): se conserva. */
export async function checkSession(token: string): Promise<'valid' | 'invalid' | 'unknown'> {
  const r = await call<{ ok: true }>({ action: 'session' }, token);
  if (r.ok) return 'valid';
  return r.status === 401 ? 'invalid' : 'unknown';
}

/** Cierra la sesión también en el servidor: la llave deja de valer. */
export const logoutSession = (token: string) => call<{ ok: true }>({ action: 'logout' }, token);

export const saveData = (key: DataKey, value: unknown, token: string) =>
  call<{ ok: true }>({ action: 'save', key, value }, token);

export const upsertItem = <T>(key: ListKey, item: T, token: string) =>
  call<{ items: T[] }>({ action: 'upsert', key, item }, token);

/** Guarda varios elementos de una vez (una sola petición, para que no se pisen entre sí). */
export const upsertItems = <T>(key: ListKey, items: T[], token: string) =>
  call<{ items: T[] }>({ action: 'upsert', key, items }, token);

export const removeItem = <T>(key: ListKey, id: string, token: string) =>
  call<{ items: T[] }>({ action: 'remove', key, id }, token);

export const likePost = (postId: string) =>
  call<{ likes: number }>({ action: 'like', postId });

export const addComment = (postId: string, authorName: string, text: string) =>
  call<{ comment: Comment }>({ action: 'comment', postId, authorName, text });

export const deleteComment = (postId: string, commentId: string, token: string) =>
  call<{ ok: true }>({ action: 'deleteComment', postId, commentId }, token);

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  /** Solo en vídeos: conversión que Cloudinary hace en cuanto se sube (va incluida en la firma). */
  eager?: string;
  eagerAsync?: string;
}

export const signUpload = (token: string, kind: 'image' | 'video') =>
  call<UploadSignature>({ action: 'signUpload', kind }, token);
