import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { logger } from './logger';

export const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const uploadHardwareImage = async (file: File | Blob, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    // Explicitly set contentType to ensure validation passes
    const metadata = {
      contentType: file.type || 'image/jpeg',
    };
    
    // Await the upload completion
    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    // Await getDownloadURL from the snapshot reference
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    logger.error("Firebase Storage upload failed:", error);
    throw error;
  }
};
