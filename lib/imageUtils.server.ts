import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';

const WATERMARK_TEXT = '僅供青椒老師家教中心使用';
const WATERMARK_FONT_DIR = path.join(process.cwd(), 'assets/fonts');
const WATERMARK_FONT_PATH = path.join(process.cwd(), 'assets/fonts/NotoSansTC-VF.ttf');
const FONTCONFIG_DIR = path.join(os.tmpdir(), 'tutor-matching-fontconfig');
const FONTCONFIG_CACHE_DIR = path.join(os.tmpdir(), 'tutor-matching-fontconfig-cache');

let fontconfigInitialized = false;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const escapeSvgText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const assertWatermarkFontExists = () => {
  if (fs.existsSync(WATERMARK_FONT_PATH)) return;
  throw new Error(`找不到浮水印字型檔：${WATERMARK_FONT_PATH}`);
};

const ensureFontconfig = () => {
  if (fontconfigInitialized) return;

  fs.mkdirSync(FONTCONFIG_DIR, { recursive: true });
  fs.mkdirSync(FONTCONFIG_CACHE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(FONTCONFIG_DIR, 'fonts.conf'),
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${escapeSvgText(WATERMARK_FONT_DIR)}</dir>
  <cachedir>${escapeSvgText(FONTCONFIG_CACHE_DIR)}</cachedir>
</fontconfig>
`
  );
  process.env.FONTCONFIG_PATH = FONTCONFIG_DIR;
  process.env.XDG_CACHE_HOME = FONTCONFIG_CACHE_DIR;
  fontconfigInitialized = true;
};

const buildWatermarkMarkup = (width: number, height: number) => {
  const baseSize = Math.min(width, height);
  const mainFontSize = clamp(baseSize * 0.06, 26, 72);
  const timestampFontSize = clamp(baseSize * 0.026, 13, 30);
  const timestamp = new Date().toISOString();

  return `
    <span foreground="#dc2626" alpha="60%" font_desc="Noto Sans TC ${mainFontSize}">
      ${escapeSvgText(WATERMARK_TEXT)}
    </span>
    <span foreground="#dc2626" alpha="55%" font_desc="Noto Sans TC ${timestampFontSize}">
      ${escapeSvgText(timestamp)}
    </span>
  `;
};

const buildWatermarkOverlay = async (width: number, height: number) => {
  assertWatermarkFontExists();
  ensureFontconfig();

  const textWidth = Math.max(220, Math.floor(width * 0.86));
  const padding = Math.max(16, Math.floor(Math.min(width, height) * 0.05));

  const textBuffer = await sharp({
    text: {
      text: buildWatermarkMarkup(width, height),
      font: 'Noto Sans TC',
      fontfile: WATERMARK_FONT_PATH,
      width: textWidth,
      align: 'center',
      rgba: true,
    },
  })
    .png()
    .toBuffer();

  return sharp(textBuffer)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .rotate(-15, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
};

export async function addWatermark(buffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;
    const watermarkOverlay = await buildWatermarkOverlay(width, height);
    const overlayMetadata = await sharp(watermarkOverlay).metadata();
    const left = Math.max(0, Math.round((width - (overlayMetadata.width || width)) / 2));
    const top = Math.max(0, Math.round((height - (overlayMetadata.height || height)) / 2));

    return await sharp(buffer)
      .composite([
        {
          input: watermarkOverlay,
          left,
          top,
          blend: 'over',
        },
      ])
      .toBuffer();
  } catch (error) {
    console.error('添加浮水印失敗:', error);
    throw error;
  }
}
