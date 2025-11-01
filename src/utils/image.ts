export const resizeAndCropImage = (
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Important for canvas with data URLs
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      const imgRatio = img.width / img.height;
      const targetRatio = targetWidth / targetHeight;

      let drawWidth = targetWidth;
      let drawHeight = targetHeight;
      let x = 0;
      let y = 0;

      // This logic implements "object-fit: cover"
      if (imgRatio > targetRatio) {
        // Image is wider than the target canvas, so we crop the sides
        drawHeight = targetHeight;
        drawWidth = drawHeight * imgRatio;
        x = (targetWidth - drawWidth) / 2;
        y = 0;
      } else {
        // Image is taller than (or has the same aspect ratio as) the target canvas, so we crop the top and bottom
        drawWidth = targetWidth;
        drawHeight = drawWidth / imgRatio;
        x = 0;
        y = (targetHeight - drawHeight) / 2;
      }

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      // Return a PNG to ensure transparency is handled if ever needed.
      resolve(canvas.toDataURL('image/png')); 
    };
    img.onerror = (err) => {
      console.error("Image load error for resizing", err);
      reject(new Error('Failed to load image for resizing'));
    };
    img.src = imageUrl;
  });
};
