const IMGBB_API_KEY = 'c74f8ddfd641cab56a8344e006dfb5d5';

/**
 * Uploads an image File to ImgBB and returns the public URL.
 */
export const uploadImageToImgBB = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || 'Error uploading image');
    }
  } catch (error) {
    console.error('ImgBB Upload Error:', error);
    throw error;
  }
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
