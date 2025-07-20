import sharp from 'sharp';

export async function addWatermark(buffer: Buffer): Promise<Buffer> {
  try {
    // 創建一個 SVG 文字浮水印
    const watermarkSvg = `
      <svg width="1000" height="1000">
        <style>
          .text { fill: rgba(255, 0, 0, 0.5); font-size: 40px; font-family: Arial; }
          .timestamp { fill: rgba(255, 0, 0, 0.5); font-size: 20px; font-family: Arial; }
        </style>
        <text x="50%" y="50%" text-anchor="middle" class="text" transform="rotate(-15, 500, 500)">
          僅供青椒老師家教中心使用
        </text>
        <text x="50%" y="60%" text-anchor="middle" class="timestamp" transform="rotate(-15, 500, 500)">
          ${new Date().toISOString()}
        </text>
      </svg>
    `;

    // 處理圖片
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // 調整浮水印大小以適應圖片
    const watermark = Buffer.from(watermarkSvg);
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    // 合成浮水印
    return await image
      .composite([
        {
          input: watermark,
          blend: 'over',
          top: 0,
          left: 0,
          tile: true,
        },
      ])
      .toBuffer();
  } catch (error) {
    console.error('添加浮水印失敗:', error);
    throw error;
  }
} 