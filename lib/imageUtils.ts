'use client';

export async function addWatermark(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // 設定 canvas 大小
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 繪製原始圖片
      ctx?.drawImage(img, 0, 0);
      
      // 添加浮水印
      if (ctx) {
        // 設定浮水印樣式
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';    // 文字水平置中
        ctx.textBaseline = 'middle'; // 文字垂直置中

        // 計算中心點位置
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // 儲存當前狀態
        ctx.save();
        
        // 移動到中心點並旋轉
        ctx.translate(centerX, centerY);
        ctx.rotate(-Math.PI / 12); // 旋轉 -15 度
        
        // 繪製浮水印文字
        ctx.fillText('僅供青椒老師家教中心使用', 0, 0);
        ctx.font = '20px Arial';  // 較小的字體顯示時間
        ctx.fillText(new Date().toISOString(), 0, 80);
        
        // 恢復原始狀態
        ctx.restore();
      }
      
      // 轉換為 blob（使用 PNG 格式保持原始品質）
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    // 讀取檔案
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// 圖片壓縮功能
export async function compressImage(file: File, maxSizeMB: number = 5): Promise<File> {
  // 如果檔案已經小於限制，直接返回
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  console.log(`開始壓縮圖片: 原始大小 ${(file.size / 1024 / 1024).toFixed(2)}MB`);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // 計算新的尺寸 - 如果圖片很大，先縮小尺寸
      let { width, height } = img;
      const maxDimension = 2000; // 最大尺寸限制

      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
        console.log(`調整圖片尺寸至: ${width}x${height}`);
      }

      canvas.width = width;
      canvas.height = height;

      // 繪製壓縮後的圖片
      ctx?.drawImage(img, 0, 0, width, height);

      // 嘗試不同的品質設定來達到目標大小
      compressWithQuality(canvas, file.name, file.type, maxSizeMB)
        .then(resolve)
        .catch(reject);
    };

    img.onerror = () => reject(new Error('無法載入圖片'));

    // 讀取檔案
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// 使用不同品質設定壓縮圖片
async function compressWithQuality(
  canvas: HTMLCanvasElement, 
  fileName: string, 
  fileType: string, 
  maxSizeMB: number
): Promise<File> {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  // 確定輸出格式 - 如果不是JPEG，轉換為JPEG以獲得更好的壓縮
  let outputType = fileType;
  if (!fileType.includes('jpeg') && !fileType.includes('jpg')) {
    outputType = 'image/jpeg';
  }

  // 嘗試不同的品質設定
  const qualityLevels = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
  
  for (const quality of qualityLevels) {
    const blob = await canvasToBlob(canvas, outputType, quality);
    
    console.log(`品質 ${quality}: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
    
    if (blob.size <= maxBytes) {
      // 成功壓縮到目標大小
      const compressedFile = new File([blob], fileName, { 
        type: outputType,
        lastModified: Date.now()
      });
      
      console.log(`壓縮完成: 從 ${(maxBytes / 1024 / 1024).toFixed(2)}MB+ 壓縮至 ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      return compressedFile;
    }
  }

  // 如果最低品質仍然太大，進一步縮小尺寸
  const smallerCanvas = document.createElement('canvas');
  const smallerCtx = smallerCanvas.getContext('2d');
  
  // 縮小到 80% 尺寸
  smallerCanvas.width = Math.floor(canvas.width * 0.8);
  smallerCanvas.height = Math.floor(canvas.height * 0.8);
  
  smallerCtx?.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
  
  console.log(`進一步縮小尺寸至: ${smallerCanvas.width}x${smallerCanvas.height}`);
  
  // 再次嘗試壓縮
  for (const quality of qualityLevels) {
    const blob = await canvasToBlob(smallerCanvas, outputType, quality);
    
    if (blob.size <= maxBytes) {
      const compressedFile = new File([blob], fileName, { 
        type: outputType,
        lastModified: Date.now()
      });
      
      console.log(`最終壓縮完成: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      return compressedFile;
    }
  }

  // 如果還是太大，返回最小品質的版本
  const finalBlob = await canvasToBlob(smallerCanvas, outputType, 0.1);
  const finalFile = new File([finalBlob], fileName, { 
    type: outputType,
    lastModified: Date.now()
  });
  
  console.log(`使用最小品質: ${(finalBlob.size / 1024 / 1024).toFixed(2)}MB`);
  return finalFile;
}

// Canvas 轉 Blob 的 Promise 包裝
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('無法建立 blob'));
    }, type, quality);
  });
} 