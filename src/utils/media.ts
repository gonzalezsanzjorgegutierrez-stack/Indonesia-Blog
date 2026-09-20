import { signUpload, type UploadSignature } from './api';

export type MediaKind = 'image' | 'video';

export interface UploadedMedia {
  url: string;
  kind: MediaKind;
}

// Límite de vídeo del plan gratuito de Cloudinary
export const MAX_VIDEO_MB = 100;

// Las fotos de móvil se reducen antes de subirlas: pesan menos y suben antes con datos flojos
const IMAGE_MAX_BYTES = 9 * 1024 * 1024;
const IMAGE_ATTEMPTS: [maxSide: number, quality: number][] = [
  [1920, 0.82],
  [1280, 0.7],
  [900, 0.6],
];

const compressImage = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  try {
    for (const [maxSide, quality] of IMAGE_ATTEMPTS) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= IMAGE_MAX_BYTES) return blob;
    }
  } finally {
    bitmap.close();
  }
  throw new Error('La foto es demasiado grande incluso reducida');
};

/** Sube el archivo directamente a Cloudinary con la firma que da nuestro servidor. */
const sendToCloudinary = (
  file: Blob,
  kind: MediaKind,
  sign: UploadSignature,
  onProgress?: (fraction: number) => void
): Promise<string> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sign.cloudName}/${kind}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new Error('Se cortó la conexión al subir. Inténtalo de nuevo.'));
    xhr.onload = () => {
      let data: { secure_url?: string; error?: { message?: string } } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* respuesta no JSON: se trata abajo */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) resolve(data.secure_url);
      else reject(new Error(data.error?.message ?? `Cloudinary rechazó el archivo (error ${xhr.status})`));
    };

    const form = new FormData();
    form.append('file', file);
    form.append('api_key', sign.apiKey);
    form.append('timestamp', String(sign.timestamp));
    form.append('folder', sign.folder);
    form.append('signature', sign.signature);
    // Los parámetros firmados tienen que enviarse tal cual: si falta alguno, Cloudinary rechaza la firma
    if (sign.eager) form.append('eager', sign.eager);
    if (sign.eagerAsync) form.append('eager_async', sign.eagerAsync);
    xhr.send(form);
  });

/**
 * URL pública lista para usar:
 * - fotos: calidad automática
 * - vídeos: la conversión que definió el servidor (MP4 H.264, máx. 1280 px), que Cloudinary
 *   ya está generando en segundo plano. Puede tardar un poco en verse la primera vez.
 */
const optimizedUrl = (secureUrl: string, kind: MediaKind, sign: UploadSignature): string =>
  kind === 'image'
    ? secureUrl.replace('/upload/', '/upload/q_auto/')
    : secureUrl
        .replace('/upload/', `/upload/${sign.eager ?? 'f_mp4,vc_h264,q_auto'}/`)
        .replace(/\.[A-Za-z0-9]+$/, '.mp4');

/**
 * Sube una foto o un vídeo y devuelve la URL pública lista para usar.
 * @param onProgress recibe un valor entre 0 y 1 mientras se sube
 */
export const uploadMedia = async (
  file: File,
  adminToken: string,
  onProgress?: (fraction: number) => void
): Promise<UploadedMedia> => {
  const kind: MediaKind | null = file.type.startsWith('image/')
    ? 'image'
    : file.type.startsWith('video/')
      ? 'video'
      : null;
  if (!kind) throw new Error('Formato no soportado: sube una foto o un vídeo.');

  if (kind === 'video' && file.size > MAX_VIDEO_MB * 1024 * 1024) {
    const mb = Math.round(file.size / 1024 / 1024);
    throw new Error(
      `El vídeo pesa ${mb} MB y el máximo es ${MAX_VIDEO_MB} MB (unos 30-40 s en 1080p). ` +
        'Grábalo en 720p, recórtalo, o pega un enlace de YouTube.'
    );
  }

  const body = kind === 'image' ? await compressImage(file) : file;

  const signed = await signUpload(adminToken, kind);
  if (!signed.ok) throw new Error(signed.error);

  const secureUrl = await sendToCloudinary(body, kind, signed.data, onProgress);
  return { url: optimizedUrl(secureUrl, kind, signed.data), kind };
};

/**
 * Intercepts Google Drive share links and converts them to direct image URLs.
 * Example input: https://drive.google.com/file/d/1A2B3C4D5E6F/view?usp=sharing
 * Example output: https://drive.google.com/uc?export=view&id=1A2B3C4D5E6F
 * If it's not a drive link, returns it unmodified.
 */
export const formatImageUrl = (url: string): string => {
  if (!url) return url;

  // Check for standard Google Drive share URL
  const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);

  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  return url;
};
