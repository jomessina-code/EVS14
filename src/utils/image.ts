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

export const cropImage = (
  imageUrl: string,
  cropArea: { x: number; y: number; width: number; height: number } // in percentages
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const sourceX = img.width * cropArea.x;
      const sourceY = img.height * cropArea.y;
      const sourceWidth = img.width * cropArea.width;
      const sourceHeight = img.height * cropArea.height;

      const canvas = document.createElement('canvas');
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => {
      console.error("Image load error for cropping", err);
      reject(new Error('Failed to load image for cropping'));
    };
    img.src = imageUrl;
  });
};
