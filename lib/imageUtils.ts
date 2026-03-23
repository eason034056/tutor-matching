'use client';

const heicExtensionPattern = /\.(heic|heif)$/i

const isHeicLikeFile = (file: File) => {
  const normalizedType = (file.type || '').toLowerCase()
  const normalizedName = (file.name || '').toLowerCase()
  return (
    normalizedType.includes('heic') ||
    normalizedType.includes('heif') ||
    heicExtensionPattern.test(normalizedName)
  )
}

const toJpegFileName = (originalName: string) => {
  const normalized = originalName.trim() || 'photo'
  if (normalized.includes('.')) {
    return normalized.replace(/\.[^.]+$/, '.jpg')
  }
  return `${normalized}.jpg`
}

const convertHeicToJpeg = async (file: File): Promise<File> => {
  const { default: heic2any } = await import('heic2any')
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  })

  const outputBlob = Array.isArray(converted) ? converted[0] : converted
  if (!(outputBlob instanceof Blob)) {
    throw new Error('HEIC 轉檔失敗，請改用 JPG 或 PNG。')
  }

  return new File([outputBlob], toJpegFileName(file.name), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

// 🔧 新增：檢測瀏覽器是否支援 WebP
function isWebPSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    // 嘗試創建WebP格式的blob
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  } catch {
    return false;
  }
}

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
      
      // 🔧 改進：智能格式選擇 - 保持支援品質參數的格式，優化不支援的格式
      let outputType = file.type;
      let quality: number | undefined = 0.9; // 品質設定
      
      // 支援品質參數的格式：保持原格式
      if (file.type.includes('jpeg') || file.type.includes('jpg')) {
        // JPEG格式：品質0.9
        outputType = file.type;
        quality = 0.9;
      } else if (file.type.includes('webp')) {
        // WebP格式：品質0.9（WebP通常比PNG小很多）
        outputType = file.type;
        quality = 0.9;
      } else if (file.type.includes('avif')) {
        // AVIF格式：品質0.9（最新的高效格式）
        outputType = file.type;
        quality = 0.9;
      } else {
        // 不支援品質參數的格式（PNG, GIF, BMP, TIFF等）
        // 優先選擇：WebP > JPEG > PNG
        if (isWebPSupported()) {
          outputType = 'image/webp';
          quality = 0.9;
        } else {
          outputType = 'image/jpeg';
          quality = 0.9;
        }
      }
      
      console.log(`使用輸出格式: ${outputType}${quality ? `, 品質: ${quality}` : ''}`);
      
      // 轉換為blob，保持原始格式
      canvas.toBlob((blob) => {
        if (blob) {
          console.log(`浮水印處理完成: ${(blob.size / 1024 / 1024).toFixed(2)}MB (${outputType})`);
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, outputType, quality);
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
  
  // 🔧 改進：智能選擇最佳壓縮格式
  let outputType = fileType;
  
  // 如果原格式支援品質參數，保持原格式
  if (fileType.includes('jpeg') || fileType.includes('jpg') || 
      fileType.includes('webp') || fileType.includes('avif')) {
    outputType = fileType;
  } else {
    // 不支援品質參數的格式，選擇最佳壓縮格式
    if (isWebPSupported()) {
      outputType = 'image/webp'; // WebP壓縮效果最好
    } else {
      outputType = 'image/jpeg'; // 退回JPEG
    }
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

// 完整處理流程（僅客端壓縮）。浮水印統一交由 server 端處理，避免重複加印。
export async function processImageComplete(file: File, maxSizeMB: number = 5): Promise<File> {
  let normalizedFile = file;
  if (isHeicLikeFile(file)) {
    console.log(`偵測到 HEIC/HEIF，開始轉換: ${file.name}`);
    normalizedFile = await convertHeicToJpeg(file);
    console.log(`HEIC 轉換完成: ${normalizedFile.name}`);
  }

  console.log(`開始圖片壓縮: ${normalizedFile.name}, 原始大小: ${(normalizedFile.size / 1024 / 1024).toFixed(2)}MB`);

  if (normalizedFile.size <= maxSizeMB * 1024 * 1024) {
    return normalizedFile;
  }

  const compressedFile = await compressImage(normalizedFile, maxSizeMB);
  console.log(`圖片壓縮完成: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
  return compressedFile;
}
