/**
 * Utility to process and optimize image files selected from the user's device
 * (smartphones, tablets, desktop files, camera photos).
 * Resizes and compresses images client-side via Canvas so they load rapidly
 * and fit safely within Firestore document limits (< 100KB typical).
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function optimizeImageFromDevice(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<string> {
  const { maxWidth = 1200, maxHeight = 800, quality = 0.82 } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file (JPEG, PNG, WebP, etc.).');
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.naturalWidth || img.width;
      let targetHeight = img.naturalHeight || img.height;

      if (!targetWidth || !targetHeight) {
        reject(new Error('Unable to read image dimensions.'));
        return;
      }

      // Calculate aspect ratio scale
      let ratio = 1;
      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const widthRatio = maxWidth / targetWidth;
        const heightRatio = maxHeight / targetHeight;
        ratio = Math.min(widthRatio, heightRatio);
      }

      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context.'));
        return;
      }

      // Fill transparent backgrounds with soft dark neutral to avoid black margins on PNGs
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Compress to JPEG/WebP
      let outputDataUrl = canvas.toDataURL('image/jpeg', quality);

      // Safeguard: if base64 size is still unusually large (> 500KB), recompress at lower quality
      if (outputDataUrl.length > 500 * 1024) {
        outputDataUrl = canvas.toDataURL('image/jpeg', 0.65);
      }

      resolve(outputDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image from your device. Please try another image.'));
    };

    img.src = objectUrl;
  });
}
