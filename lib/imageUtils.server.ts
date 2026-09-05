import sharp from 'sharp';

const WATERMARK_TEXT = '僅供青椒老師家教中心使用';
const WATERMARK_FALLBACK_TEXT = 'FOR PEPPER TEACHER TUTOR CENTER ONLY';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const escapeSvgText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildDiagonalLines = (width: number, height: number, gap: number) => {
  const lines: string[] = [];

  for (let offset = -height; offset < width + height; offset += gap) {
    lines.push(`<line x1="${offset}" y1="${height}" x2="${offset + height}" y2="0" />`);
  }

  return lines.join('');
};

const buildTiledFallbackText = (width: number, height: number, fontSize: number, gap: number) => {
  const labels: string[] = [];
  const stepX = Math.max(width * 0.58, 420);
  const stepY = Math.max(gap * 1.15, 130);

  for (let y = -height; y < height * 2; y += stepY) {
    for (let x = -width; x < width * 2; x += stepX) {
      labels.push(`<text x="${x}" y="${y}">${escapeSvgText(WATERMARK_FALLBACK_TEXT)}</text>`);
    }
  }

  return labels.join('');
};

const buildWatermarkSvg = (width: number, height: number) => {
  const baseSize = Math.min(width, height);
  const mainFontSize = clamp(baseSize * 0.06, 26, 72);
  const fallbackFontSize = clamp(baseSize * 0.032, 16, 38);
  const timestampFontSize = clamp(baseSize * 0.026, 13, 30);
  const lineGap = clamp(baseSize * 0.22, 90, 220);
  const lineWidth = clamp(baseSize * 0.012, 5, 16);
  const timestamp = new Date().toISOString();

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <g opacity="0.2" stroke="#ffffff" stroke-width="${lineWidth * 2.2}" stroke-linecap="round">
        ${buildDiagonalLines(width, height, lineGap)}
      </g>
      <g opacity="0.32" stroke="#dc2626" stroke-width="${lineWidth}" stroke-linecap="round">
        ${buildDiagonalLines(width, height, lineGap)}
      </g>
      <g
        transform="rotate(-18 ${width / 2} ${height / 2})"
        fill="#dc2626"
        opacity="0.22"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fallbackFontSize}"
        font-weight="700"
      >
        ${buildTiledFallbackText(width, height, fallbackFontSize, lineGap)}
      </g>
      <g transform="rotate(-15 ${width / 2} ${height / 2})" text-anchor="middle" font-weight="700">
        <text
          x="50%"
          y="50%"
          fill="#ffffff"
          stroke="#ffffff"
          stroke-width="${Math.max(2, lineWidth / 3)}"
          opacity="0.42"
          font-family="PingFang TC, Microsoft JhengHei, Noto Sans TC, Noto Sans CJK TC, Arial, sans-serif"
          font-size="${mainFontSize}"
        >${escapeSvgText(WATERMARK_TEXT)}</text>
        <text
          x="50%"
          y="50%"
          fill="#dc2626"
          opacity="0.55"
          font-family="PingFang TC, Microsoft JhengHei, Noto Sans TC, Noto Sans CJK TC, Arial, sans-serif"
          font-size="${mainFontSize}"
        >${escapeSvgText(WATERMARK_TEXT)}</text>
        <text
          x="50%"
          y="${height * 0.6}"
          fill="#dc2626"
          opacity="0.55"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${fallbackFontSize}"
        >${escapeSvgText(WATERMARK_FALLBACK_TEXT)}</text>
        <text
          x="50%"
          y="${height * 0.66}"
          fill="#dc2626"
          opacity="0.5"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${timestampFontSize}"
        >${escapeSvgText(timestamp)}</text>
      </g>
    </svg>
  `;
};

export async function addWatermark(buffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;
    const watermarkSvg = buildWatermarkSvg(width, height);

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
