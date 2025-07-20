import sharp from 'sharp';

export async function addWatermark(buffer: Buffer): Promise<Buffer> {
  try {
    // 獲取原始圖片的尺寸
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    // 創建一個適應圖片尺寸的 SVG 文字浮水印
    const watermarkSvg = `
      <svg width="${width}" height="${height}">
        <style>
          .text { fill: rgba(255, 0, 0, 0.5); font-size: ${Math.min(width, height) * 0.05}px; font-family: Arial; }
          .timestamp { fill: rgba(255, 0, 0, 0.5); font-size: ${Math.min(width, height) * 0.025}px; font-family: Arial; }
        </style>
        <text x="50%" y="50%" text-anchor="middle" class="text" transform="rotate(-15, ${width/2}, ${height/2})">
          僅供青椒老師家教中心使用
        </text>
        <text x="50%" y="60%" text-anchor="middle" class="timestamp" transform="rotate(-15, ${width/2}, ${height/2})">
          ${new Date().toISOString()}
        </text>
      </svg>
    `;

    // 處理圖片
    return await sharp(buffer)
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          blend: 'over',
        },
      ])
      .toBuffer();

  } catch (error) {
    console.error('添加浮水印失敗:', error);
    throw error;
  }
} 