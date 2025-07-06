import React, { useRef, useState } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import { Button } from './ui/button';
import 'react-image-crop/dist/ReactCrop.css';

// 定義 props 型別
interface CropperPageProps {
  image: string;
  onCancel: () => void;
  onCropComplete: (cropped: string) => void;
}

function getCroppedImg(image: HTMLImageElement, crop: Crop): string | null {
  if (!crop.width || !crop.height) return null;
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );
  return canvas.toDataURL('image/jpeg');
}

export default function CropperPage({ image, onCancel, onCropComplete }: CropperPageProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const onImageLoad = () => {
    setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
  };

  const handleDone = () => {
    if (imgRef.current && completedCrop) {
      const cropped = getCroppedImg(imgRef.current, completedCrop);
      if (cropped) onCropComplete(cropped);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
            aspect={undefined}
            className="bg-white p-4 rounded shadow-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={image}
              alt="裁切圖片"
              style={{objectFit: 'scale-down' }}
              onLoad={e => { imgRef.current = e.currentTarget; onImageLoad(); }}
            />
          </ReactCrop>
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-10">
          <Button onClick={onCancel} variant="outline">取消</Button>
          <Button onClick={handleDone} className="bg-blue-500 text-white">完成裁切</Button>
        </div>
      </div>
    </div>
  );
} 