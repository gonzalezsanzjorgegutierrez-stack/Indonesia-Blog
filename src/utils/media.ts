import { uploadImage } from './api';

// Vercel limita el cuerpo de una petición a ~4,5 MB, así que las fotos se
// reducen en el navegador antes de subirlas (una foto de móvil pesa 3-8 MB).
const MAX_BASE64_CHARS = 4_200_000;
const ATTEMPTS: [maxSide: number, quality: number][] = [
  [1920, 0.82],
  [1280, 0.7],
  [900, 0.6],
];

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(blob);
  });

const compressImage = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se pueden subir fotos. Para vídeos, pega un enlace en el campo de URL.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    for (const [maxSide, quality] of ATTEMPTS) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (!blob) continue;

      const base64 = await blobToBase64(blob);
      if (base64.length <= MAX_BASE64_CHARS) return base64;
    }
  } finally {
    bitmap.close();
  }
  throw new Error('La foto es demasiado grande incluso reducida');
};

/**
 * Reduce la foto y la sube a ImgBB a través del servidor (la clave de ImgBB
 * vive en Vercel, no en el código). Devuelve la URL pública.
 */
export const uploadImageToImgBB = async (file: File, adminPin: string): Promise<string> => {
  const image = await compressImage(file);
  const result = await uploadImage(image, adminPin);
  if (!result.ok) throw new Error(result.error);
  return result.data.url;
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
