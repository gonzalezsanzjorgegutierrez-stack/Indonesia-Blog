import { timingSafeEqual } from 'node:crypto';

/**
 * Backend del blog (Vercel Function). Guarda los datos compartidos en Redis (Upstash).
 *
 * Variables de entorno (Vercel → Settings → Environment Variables):
 *   KV_REST_API_URL, KV_REST_API_TOKEN  → las crea la integración de Upstash
 *   ADMIN_PIN                           → PIN de la pareja (nunca va en el código)
 *   IMGBB_API_KEY                       → clave de ImgBB para subir fotos
 */

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

type Cmd = (string | number)[];
type Item = { id: string; [key: string]: unknown };
type Auth = 'ok' | 'wrong' | 'blocked' | 'noconfig';

const KEYS = {
  posts: 'blog:posts',
  stories: 'blog:stories',
  islandPins: 'blog:pins',
  stats: 'blog:stats',
} as const;
type DataKey = keyof typeof KEYS;
type ListKey = 'posts' | 'stories';

const LIKES_KEY = 'blog:likes';
const commentsKey = (postId: string) => `blog:comments:${postId}`;

const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_JSON_CHARS = 900_000;
const MAX_IMAGE_CHARS = 4_300_000;
const MAX_COMMENTS_PER_POST = 200;
const PIN_FAIL_LIMIT = 10;
const PIN_FAIL_WINDOW_SEC = 900;

// ---------- Redis (Upstash REST) ----------

async function pipeline(cmds: Cmd[]): Promise<unknown[]> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Base de datos no configurada');

  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);

  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((o) => {
    if (o.error) throw new Error(o.error);
    return o.result ?? null;
  });
}

function parseJson<T>(raw: unknown): T | null {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ---------- Seguridad ----------

function clientIp(req: Req): string {
  const forwarded = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (value ?? '').split(',')[0].trim() || 'unknown';
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Comprueba el PIN. Tras 10 fallos desde la misma IP se bloquea (incluso con el PIN correcto). */
async function authenticate(pin: unknown, ip: string): Promise<Auth> {
  const expected = process.env.ADMIN_PIN;
  if (!expected) return 'noconfig';

  const key = `rl:pin:${ip}`;
  const [fails] = await pipeline([['GET', key]]);
  if (Number(fails ?? 0) >= PIN_FAIL_LIMIT) return 'blocked';

  if (typeof pin === 'string' && safeEqual(pin, expected)) return 'ok';

  await pipeline([['INCR', key], ['EXPIRE', key, PIN_FAIL_WINDOW_SEC]]);
  return 'wrong';
}

function denyAuth(res: Res, auth: Exclude<Auth, 'ok'>): void {
  const table = {
    wrong: [401, 'PIN incorrecto'],
    blocked: [429, 'Demasiados intentos. Espera unos minutos.'],
    noconfig: [500, 'Falta configurar ADMIN_PIN en Vercel'],
  } as const;
  const [status, error] = table[auth];
  res.status(status).json({ error, code: auth });
}

async function requireAdmin(req: Req, res: Res, ip: string): Promise<boolean> {
  const header = req.headers['x-admin-pin'];
  const pin = Array.isArray(header) ? header[0] : header;
  const auth = await authenticate(pin, ip);
  if (auth === 'ok') return true;
  denyAuth(res, auth);
  return false;
}

/** Límite por IP para acciones públicas (likes, comentarios). */
async function allow(bucket: string, ip: string, limit: number, windowSec: number): Promise<boolean> {
  const key = `rl:${bucket}:${ip}`;
  const [count] = await pipeline([['INCR', key], ['EXPIRE', key, windowSec]]);
  return Number(count) <= limit;
}

// ---------- Datos ----------

const isDataKey = (key: unknown): key is DataKey => typeof key === 'string' && key in KEYS;
const isListKey = (key: unknown): key is ListKey => key === 'posts' || key === 'stories';

async function readList(key: ListKey): Promise<Item[]> {
  const [raw] = await pipeline([['GET', KEYS[key]]]);
  const list = parseJson<Item[]>(raw);
  return Array.isArray(list) ? list : [];
}

async function postExists(postId: string): Promise<boolean> {
  return (await readList('posts')).some((p) => p.id === postId);
}

async function readAll() {
  const [posts, stories, pins, stats, likesRaw] = await pipeline([
    ['GET', KEYS.posts],
    ['GET', KEYS.stories],
    ['GET', KEYS.islandPins],
    ['GET', KEYS.stats],
    ['HGETALL', LIKES_KEY],
  ]);

  const postList = parseJson<Item[]>(posts);

  const likes: Record<string, number> = {};
  if (Array.isArray(likesRaw)) {
    for (let i = 0; i + 1 < likesRaw.length; i += 2) likes[String(likesRaw[i])] = Number(likesRaw[i + 1]);
  } else if (likesRaw && typeof likesRaw === 'object') {
    for (const [id, n] of Object.entries(likesRaw)) likes[id] = Number(n);
  }

  const comments: Record<string, unknown[]> = {};
  if (Array.isArray(postList) && postList.length > 0) {
    const lists = await pipeline(postList.map((p): Cmd => ['LRANGE', commentsKey(p.id), 0, -1]));
    postList.forEach((p, i) => {
      const raw = lists[i];
      if (Array.isArray(raw) && raw.length > 0) {
        comments[p.id] = raw.map((entry) => parseJson<unknown>(entry)).filter(Boolean);
      }
    });
  }

  return {
    posts: postList,
    stories: parseJson<unknown>(stories),
    islandPins: parseJson<unknown>(pins),
    stats: parseJson<unknown>(stats),
    likes,
    comments,
  };
}

// ---------- Handler ----------

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      res.status(200).json(await readAll());
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método no permitido' });
      return;
    }

    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const ip = clientIp(req);

    switch (body.action) {
      case 'verify': {
        const auth = await authenticate(body.pin, ip);
        if (auth === 'ok') res.status(200).json({ ok: true });
        else denyAuth(res, auth);
        return;
      }

      case 'save': {
        if (!(await requireAdmin(req, res, ip))) return;
        const { key, value } = body;
        if (!isDataKey(key)) {
          res.status(400).json({ error: 'Clave no válida' });
          return;
        }
        const validShape =
          key === 'stats'
            ? typeof value === 'object' && value !== null && !Array.isArray(value)
            : Array.isArray(value);
        if (!validShape) {
          res.status(400).json({ error: 'Formato no válido' });
          return;
        }
        const json = JSON.stringify(value);
        if (json.length > MAX_JSON_CHARS) {
          res.status(413).json({ error: 'Demasiados datos' });
          return;
        }
        await pipeline([['SET', KEYS[key], json]]);
        res.status(200).json({ ok: true });
        return;
      }

      case 'upsert': {
        if (!(await requireAdmin(req, res, ip))) return;
        const { key } = body;
        const item = body.item as Item | undefined;
        if (!isListKey(key) || !item || typeof item.id !== 'string' || !ID_RE.test(item.id)) {
          res.status(400).json({ error: 'Datos no válidos' });
          return;
        }
        const list = await readList(key);
        const items = list.some((i) => i.id === item.id)
          ? list.map((i) => (i.id === item.id ? item : i))
          : [item, ...list];
        const json = JSON.stringify(items);
        if (json.length > MAX_JSON_CHARS) {
          res.status(413).json({ error: 'Demasiados datos' });
          return;
        }
        await pipeline([['SET', KEYS[key], json]]);
        res.status(200).json({ ok: true, items });
        return;
      }

      case 'remove': {
        if (!(await requireAdmin(req, res, ip))) return;
        const { key, id } = body;
        if (!isListKey(key) || typeof id !== 'string' || !ID_RE.test(id)) {
          res.status(400).json({ error: 'Datos no válidos' });
          return;
        }
        const items = (await readList(key)).filter((i) => i.id !== id);
        await pipeline([['SET', KEYS[key], JSON.stringify(items)]]);
        if (key === 'posts') await pipeline([['DEL', commentsKey(id)], ['HDEL', LIKES_KEY, id]]);
        res.status(200).json({ ok: true, items });
        return;
      }

      case 'like': {
        const { postId } = body;
        if (typeof postId !== 'string' || !ID_RE.test(postId)) {
          res.status(400).json({ error: 'Post no válido' });
          return;
        }
        if (!(await allow('like', ip, 60, 3600))) {
          res.status(429).json({ error: 'Demasiados likes seguidos' });
          return;
        }
        if (!(await postExists(postId))) {
          res.status(404).json({ error: 'Post no encontrado' });
          return;
        }
        const [count] = await pipeline([['HINCRBY', LIKES_KEY, postId, 1]]);
        res.status(200).json({ ok: true, likes: Number(count) });
        return;
      }

      case 'comment': {
        const { postId } = body;
        const authorName = typeof body.authorName === 'string' ? body.authorName.trim() : '';
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        if (typeof postId !== 'string' || !ID_RE.test(postId)) {
          res.status(400).json({ error: 'Post no válido' });
          return;
        }
        if (!authorName || authorName.length > 40 || !text || text.length > 500) {
          res.status(400).json({ error: 'Nombre (máx. 40) y mensaje (máx. 500) son obligatorios' });
          return;
        }
        if (!(await allow('comment', ip, 10, 3600))) {
          res.status(429).json({ error: 'Demasiados comentarios seguidos, inténtalo más tarde' });
          return;
        }
        if (!(await postExists(postId))) {
          res.status(404).json({ error: 'Post no encontrado' });
          return;
        }
        const comment = {
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          authorName,
          text,
          date: new Date().toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Makassar',
          }),
          isApproved: true,
        };
        await pipeline([
          ['LPUSH', commentsKey(postId), JSON.stringify(comment)],
          ['LTRIM', commentsKey(postId), 0, MAX_COMMENTS_PER_POST - 1],
        ]);
        res.status(200).json({ ok: true, comment });
        return;
      }

      case 'deleteComment': {
        if (!(await requireAdmin(req, res, ip))) return;
        const { postId, commentId } = body;
        if (
          typeof postId !== 'string' || !ID_RE.test(postId) ||
          typeof commentId !== 'string' || !ID_RE.test(commentId)
        ) {
          res.status(400).json({ error: 'Datos no válidos' });
          return;
        }
        const [raw] = await pipeline([['LRANGE', commentsKey(postId), 0, -1]]);
        const entries = Array.isArray(raw) ? (raw as string[]) : [];
        const target = entries.find((e) => parseJson<{ id?: string }>(e)?.id === commentId);
        if (target) await pipeline([['LREM', commentsKey(postId), 1, target]]);
        res.status(200).json({ ok: true });
        return;
      }

      case 'upload': {
        if (!(await requireAdmin(req, res, ip))) return;
        const { image } = body;
        if (typeof image !== 'string' || image.length < 100 || image.length > MAX_IMAGE_CHARS) {
          res.status(400).json({ error: 'Imagen no válida o demasiado grande' });
          return;
        }
        const apiKey = process.env.IMGBB_API_KEY;
        if (!apiKey) {
          res.status(500).json({ error: 'Falta configurar IMGBB_API_KEY en Vercel' });
          return;
        }
        const upstream = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ image }),
        });
        const data = (await upstream.json().catch(() => null)) as
          | { success?: boolean; data?: { url?: string }; error?: { message?: string } }
          | null;
        if (data?.success && data.data?.url) {
          res.status(200).json({ ok: true, url: data.data.url });
        } else {
          res.status(502).json({ error: data?.error?.message ?? 'ImgBB no pudo procesar la imagen' });
        }
        return;
      }

      default:
        res.status(400).json({ error: 'Acción desconocida' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
}
