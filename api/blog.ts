import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Backend del blog (Vercel Function). Guarda los datos compartidos en Redis (Upstash).
 *
 * Variables de entorno (Vercel → Settings → Environment Variables):
 *   KV_REST_API_URL, KV_REST_API_TOKEN  → las crea la integración de Upstash
 *   ADMIN_PIN                           → PIN de la pareja (nunca va en el código)
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *                                       → fotos y vídeos (el navegador sube directo a Cloudinary
 *                                         con una firma que genera este servidor)
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
const UPLOAD_FOLDER = 'nusa-odyssey';
// Conversión de los vídeos: MP4 H.264 (lo reproduce cualquier navegador; el .mov/HEVC del iPhone no)
// limitado a 1280 px para no gastar el ancho de banda del plan gratuito
const VIDEO_TRANSFORMATION = 'c_limit,w_1280,h_1280,f_mp4,vc_h264,q_auto';
const MAX_BATCH = 20;
const MAX_COMMENTS_PER_POST = 200;
// La contraseña de la pareja debe ser larga: un PIN corto se adivina por fuerza bruta
const MIN_SECRET_LENGTH = 10;
const PIN_FAIL_LIMIT = 5;
const PIN_FAIL_WINDOW_SEC = 900;
const LOCK_BASE_SEC = 900;
const LOCK_MAX_SEC = 86_400;

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

/**
 * Comprueba la contraseña de la pareja.
 * - Se exige un mínimo de 10 caracteres en ADMIN_PIN. Si no se cumple no deja entrar a
 *   nadie y responde igual que si faltara la variable: el motivo solo se apunta en los
 *   registros de Vercel, para no decirle a un atacante que la contraseña es corta.
 * - 5 fallos desde una IP la bloquean, incluso con la contraseña correcta, y el
 *   bloqueo se duplica en cada reincidencia: 15 min, 30 min, 1 h ... hasta 24 h.
 */
async function authenticate(pin: unknown, ip: string): Promise<Auth> {
  const expected = process.env.ADMIN_PIN;
  if (!expected) {
    console.error('ADMIN_PIN no está configurada en Vercel. Acceso de administración desactivado.');
    return 'noconfig';
  }
  if (expected.length < MIN_SECRET_LENGTH) {
    console.error(`ADMIN_PIN demasiado corta: usa al menos ${MIN_SECRET_LENGTH} caracteres. Acceso de administración desactivado.`);
    return 'noconfig';
  }

  const lockKey = `rl:pinlock:${ip}`;
  const failKey = `rl:pin:${ip}`;
  const strikeKey = `rl:pinstrikes:${ip}`;

  const [locked] = await pipeline([['GET', lockKey]]);
  if (locked) return 'blocked';

  if (typeof pin === 'string' && safeEqual(pin, expected)) {
    await pipeline([['DEL', failKey]]);
    return 'ok';
  }

  const [fails] = await pipeline([['INCR', failKey]]);
  if (Number(fails) === 1) await pipeline([['EXPIRE', failKey, PIN_FAIL_WINDOW_SEC]]);
  if (Number(fails) < PIN_FAIL_LIMIT) return 'wrong';

  const [strikes] = await pipeline([['INCR', strikeKey], ['EXPIRE', strikeKey, LOCK_MAX_SEC]]);
  const lockSec = Math.min(LOCK_BASE_SEC * 2 ** (Number(strikes) - 1), LOCK_MAX_SEC);
  await pipeline([['SET', lockKey, '1', 'EX', lockSec], ['DEL', failKey]]);
  return 'blocked';
}

function denyAuth(res: Res, auth: Exclude<Auth, 'ok'>): void {
  const table = {
    wrong: [401, 'Contraseña incorrecta'],
    blocked: [429, 'Demasiados intentos. Espera un rato antes de volver a probar.'],
    // Una configuración mala se responde igual que una contraseña mala: quien pregunta desde fuera
    // no debe enterarse de nada. El motivo real queda en los registros de Vercel.
    noconfig: [401, 'Contraseña incorrecta'],
  } as const;
  const [status, error] = table[auth];
  res.status(status).json({ error, code: auth === 'noconfig' ? 'wrong' : auth });
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
        // Un elemento (`item`) o varios a la vez (`items`, p. ej. las fotos de una historia)
        const incoming = (Array.isArray(body.items) ? body.items : body.item ? [body.item] : []) as Item[];
        if (
          !isListKey(key) ||
          incoming.length === 0 ||
          incoming.length > MAX_BATCH ||
          !incoming.every((i) => i && typeof i.id === 'string' && ID_RE.test(i.id))
        ) {
          res.status(400).json({ error: 'Datos no válidos' });
          return;
        }
        const list = await readList(key);
        const byId = new Map(incoming.map((i) => [i.id, i]));
        const existingIds = new Set(list.map((i) => i.id));
        // Los ya existentes se reemplazan en su sitio; los nuevos van delante, en el orden recibido
        const fresh = [...byId.values()].filter((i) => !existingIds.has(i.id));
        const items = [...fresh, ...list.map((i) => byId.get(i.id) ?? i)];
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

      // El navegador sube la foto/vídeo directamente a Cloudinary (sin pasar por aquí, que
      // limita las peticiones a 4,5 MB). Este servidor solo firma el permiso de subida.
      case 'signUpload': {
        if (!(await requireAdmin(req, res, ip))) return;
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        if (!cloudName || !apiKey || !apiSecret) {
          res.status(500).json({ error: 'Falta configurar CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en Vercel' });
          return;
        }
        const timestamp = Math.floor(Date.now() / 1000);
        const params: Record<string, string> = { folder: UPLOAD_FOLDER, timestamp: String(timestamp) };
        // Los vídeos se convierten en cuanto se suben (en segundo plano), no la primera vez que
        // alguien los pide: la conversión al vuelo puede fallar con vídeos grandes.
        if (body.kind === 'video') {
          params.eager = VIDEO_TRANSFORMATION;
          params.eager_async = 'true';
        }
        // Firma de Cloudinary: parámetros ordenados alfabéticamente + secreto, en SHA-1
        const toSign = Object.keys(params)
          .sort()
          .map((k) => `${k}=${params[k]}`)
          .join('&');
        const signature = createHash('sha1').update(toSign + apiSecret).digest('hex');
        res.status(200).json({
          ok: true,
          cloudName,
          apiKey,
          timestamp,
          folder: UPLOAD_FOLDER,
          signature,
          ...(params.eager ? { eager: params.eager, eagerAsync: params.eager_async } : {}),
        });
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
