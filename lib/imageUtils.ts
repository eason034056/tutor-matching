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