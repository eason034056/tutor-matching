/**
 * IG Story 圖片生成器
 *
 * 用 Canvas API 繪製 1080×1920 的 Instagram Story 圖片。
 * 背景為品牌綠色漸層，內容包含案件資訊與青椒老師 Logo。
 *
 * 💡 使用 Canvas API 而非 html-to-image 的原因：
 *    - 不需安裝新套件
 *    - 像素級控制，確保 IG Story 尺寸精準
 *    - 瀏覽器原生支援中文字體渲染
 */

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

// 品牌色（來自 tailwind.config.js）
const BRAND_800 = '#1f3a2d'
const BRAND_700 = '#2d5240'
const BRAND_500 = '#427A5B'
const BRAND_400 = '#82b061'

interface IgStoryInput {
  subject: string
  budgetRange: string
  location: string
  availableTime: string
  studentDescription: string
  teacherRequirements: string
}

/**
 * 中文自動換行 helper
 *
 * ⚠️ 中文沒有空格分詞，不能用英文的「按空格斷詞」邏輯。
 *    這裡逐字元量測寬度，超過 maxWidth 就換行。
 *
 * @returns 繪製完畢後的 y 座標（供後續欄位接續使用）
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = Infinity,
): number {
  let currentLine = ''
  let lineCount = 0

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    // 遇到換行符直接斷行
    if (char === '\n') {
      ctx.fillText(currentLine, x, y)
      y += lineHeight
      lineCount++
      currentLine = ''
      if (lineCount >= maxLines) {
        // 在最後一行末尾加上省略號
        break
      }
      continue
    }

    const testLine = currentLine + char
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && currentLine.length > 0) {
      // 如果已經到達行數上限，加省略號然後停止
      if (lineCount >= maxLines - 1) {
        ctx.fillText(currentLine + '⋯', x, y)
        y += lineHeight
        return y
      }
      ctx.fillText(currentLine, x, y)
      y += lineHeight
      lineCount++
      currentLine = char
    } else {
      currentLine = testLine
    }
  }

  // 繪製最後一行
  if (currentLine) {
    ctx.fillText(currentLine, x, y)
    y += lineHeight
  }

  return y
}

/** 載入圖片為 HTMLImageElement（Promise 包裝） */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function generateIgStoryImage(
  data: IgStoryInput,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!

  // ── 1. 綠色漸層背景 ──
  // 💡 從深到淺的四段漸層，模擬原始 IG Story 的質感
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  gradient.addColorStop(0, BRAND_800)
  gradient.addColorStop(0.3, BRAND_700)
  gradient.addColorStop(0.7, BRAND_500)
  gradient.addColorStop(1, BRAND_400)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // ── 2. 半透明紋理疊加（增加質感） ──
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(0, i * 384, CANVAS_WIDTH, 2)
  }

  const marginX = 80
  const contentWidth = CANVAS_WIDTH - marginX * 2

  // ── 3. 標題 "NEW CASE" ──
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 72px "Helvetica Neue", "PingFang TC", sans-serif'
  ctx.fillText('NEW CASE', marginX, 200)

  // 標題底線裝飾
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.fillRect(marginX, 220, 200, 3)

  // ── 4. 案件資訊欄位 ──
  const fields = [
    { label: '科目', value: data.subject },
    { label: '時薪', value: data.budgetRange },
    { label: '上課地點', value: data.location },
    { label: '上課時間', value: data.availableTime },
    { label: '學生描述', value: data.studentDescription },
    { label: '教師條件', value: data.teacherRequirements },
  ]

  let currentY = 320
  const labelFont = 'bold 40px "PingFang TC", "Noto Sans TC", sans-serif'
  const lineHeight = 56

  for (const field of fields) {
    if (!field.value) continue

    // ⚠️ 防止內容太長導致文字溢出到 footer 區域
    // 每個欄位最多 4 行，學生描述最多 5 行
    const maxLines = field.label === '學生描述' ? 5 : 4

    ctx.fillStyle = '#ffffff'
    ctx.font = labelFont
    const displayText = `${field.label}：${field.value}`
    currentY = wrapText(ctx, displayText, marginX, currentY, contentWidth, lineHeight, maxLines)
    currentY += 10 // 欄位間距
  }

  // ── 5. Footer 區域 ──
  const footerY = CANVAS_HEIGHT - 260

  // 分隔線
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.fillRect(marginX, footerY, contentWidth, 1)

  // "歡迎點擊連結成為老師接案"
  ctx.fillStyle = '#f0f7ed'
  ctx.font = 'bold 36px "PingFang TC", "Noto Sans TC", sans-serif'
  ctx.fillText('歡迎點擊連結成為老師接案', marginX, footerY + 60)

  // 網址與 IG handle
  ctx.font = 'bold 28px "Helvetica Neue", "PingFang TC", sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.fillText('WWW.TUTOR-MATCHING.TW', marginX, footerY + 120)
  ctx.fillText('@PEPPERTEACHER.TW', marginX, footerY + 165)

  // ── 6. 青椒老師 Logo ──
  try {
    const logo = await loadImage('/teacher-icon.png')
    const logoSize = 180
    ctx.drawImage(
      logo,
      CANVAS_WIDTH - marginX - logoSize,
      CANVAS_HEIGHT - 300,
      logoSize,
      logoSize,
    )
  } catch {
    // Logo 載入失敗不影響主要功能，靜默跳過
    console.warn('Failed to load teacher icon for IG story')
  }

  // ── 7. 匯出為 PNG Blob ──
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      },
      'image/png',
    )
  })
}
