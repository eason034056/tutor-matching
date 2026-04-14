import 'server-only'

import { createTransport } from 'nodemailer'
import type { Transporter } from 'nodemailer'

import { adminDb } from '@/lib/firebase/firebase-admin'

// ── 型別定義 ──

export interface TutorCaseNotificationData {
  caseNumber: string
  subject: string
  displayBudget: string
  location: string
  availableTime: string
  teacherRequirements: string
  studentDescription: string
  tutorCasesUrl: string
}

export interface TutorCaseNotificationSource {
  caseNumber?: string | null
  subject?: string | null
  hourlyFee?: string | number | null
  budgetRange?: string | null
  location?: string | null
  availableTime?: string | null
  teacherRequirements?: string | null
  studentDescription?: string | null
}

type BuildNotificationOptions = {
  siteUrl?: string
}

type SendTutorCaseNotificationEmailArgs = {
  recipientEmails: string[]
  notification: TutorCaseNotificationData
}

type AdminDbLike = {
  collection: (name: string) => {
    get: () => Promise<{
      docs: Array<{
        data: () => {
          email?: string | null
          receiveNewCaseNotifications?: boolean | null
        }
      }>
    }>
  }
}

// ── 工具函式 ──

let cachedTransporter: Transporter | null = null

const smtpEnvKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'] as const

const normalizeText = (value?: string | null) => value?.trim() || ''

const ensureValue = (value: string, fallback: string) => value || fallback

const normalizeBool = (value?: string | null) => String(value).toLowerCase() === 'true'

const normalizeSiteUrl = (siteUrl?: string | null) => siteUrl?.trim().replace(/\/+$/, '') || ''

const buildAbsoluteUrl = (siteUrl: string | undefined, path: string) => {
  const normalized = normalizeSiteUrl(siteUrl)
  return normalized ? `${normalized}${path.startsWith('/') ? path : `/${path}`}` : path
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatOptionalText = (value: string) => value || 'N/A'

// ── SMTP 設定 ──

const getRequiredSmtpConfig = () => {
  const missingKeys = smtpEnvKeys.filter((key) => !normalizeText(process.env[key]))
  if (missingKeys.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missingKeys.join(', ')}`)
  }

  return {
    host: normalizeText(process.env.SMTP_HOST),
    port: Number.parseInt(normalizeText(process.env.SMTP_PORT), 10),
    secure: normalizeBool(process.env.SMTP_SECURE),
    user: normalizeText(process.env.SMTP_USER),
    pass: normalizeText(process.env.SMTP_PASS),
    fromEmail: normalizeText(process.env.SMTP_FROM_EMAIL),
    fromName: normalizeText(process.env.SMTP_FROM_NAME) || normalizeText(process.env.SITE_NAME) || '青椒老師家教中心',
  }
}

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter

  const config = getRequiredSmtpConfig()
  cachedTransporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  })

  return cachedTransporter
}

// ── 預算正規化 ──

const buildDisplayBudget = (caseData: TutorCaseNotificationSource) => {
  const budgetRange = normalizeText(caseData.budgetRange)
  if (budgetRange) return budgetRange

  if (typeof caseData.hourlyFee === 'string' && caseData.hourlyFee.trim()) {
    return caseData.hourlyFee.trim()
  }

  if (typeof caseData.hourlyFee === 'number' && Number.isFinite(caseData.hourlyFee)) {
    return `NT$${caseData.hourlyFee}/時`
  }

  return '未填預算'
}

// ── 通知資料建構 ──

export const buildTutorCaseNotificationData = (
  caseData: TutorCaseNotificationSource,
  options: BuildNotificationOptions = {}
): TutorCaseNotificationData => ({
  caseNumber: ensureValue(normalizeText(caseData.caseNumber), '未填案件編號'),
  subject: ensureValue(normalizeText(caseData.subject), '未填需求科目'),
  displayBudget: buildDisplayBudget(caseData),
  location: ensureValue(normalizeText(caseData.location), '未填地點'),
  availableTime: ensureValue(normalizeText(caseData.availableTime), '未填可上課時段'),
  teacherRequirements: normalizeText(caseData.teacherRequirements),
  studentDescription: normalizeText(caseData.studentDescription),
  tutorCasesUrl: buildAbsoluteUrl(
    options.siteUrl ?? process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
    '/tutor-cases'
  ),
})

// ── 郵件模板 ──

// 💡 複用 tutor-review.ts 的 buildEmailShell 品牌模板（綠色主題），因為收件者是教師
const buildEmailShell = ({
  eyebrow,
  title,
  intro,
  content,
  footer,
}: {
  eyebrow: string
  title: string
  intro: string
  content: string
  footer: string
}) => `
  <div style="background:#f4f0e6;padding:32px 16px;font-family:Arial,'PingFang TC','Microsoft JhengHei',sans-serif;color:#1f3a2d;">
    <div style="margin:0 auto;max-width:640px;overflow:hidden;border-radius:24px;border:1px solid #d8ebc8;background:#fffdf8;">
      <div style="padding:18px 28px;background:linear-gradient(135deg,#427A5B,#2d5240);color:#fffdf8;">
        <div style="font-size:12px;letter-spacing:0.24em;font-weight:700;">${escapeHtml(eyebrow)}</div>
        <h1 style="margin:14px 0 0;font-size:28px;line-height:1.3;">${escapeHtml(title)}</h1>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 18px;font-size:16px;line-height:1.8;">${escapeHtml(intro)}</p>
        ${content}
      </div>
      <div style="padding:20px 28px;background:#eef5e8;color:#3a6b50;font-size:13px;line-height:1.7;">
        ${footer}
      </div>
    </div>
  </div>
`.trim()

const buildTutorCaseNotificationHtml = (notification: TutorCaseNotificationData) =>
  buildEmailShell({
    eyebrow: 'NEW CASE',
    title: '新案件通知',
    intro: '您好，有一筆新的家教案件已上架，以下是案件資訊：',
    content: `
      <div style="border-radius:18px;background:#eef5e8;padding:20px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.8;"><strong>案件編號：</strong>${escapeHtml(notification.caseNumber)}</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.8;"><strong>需求科目：</strong>${escapeHtml(notification.subject)}</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.8;"><strong>期望預算：</strong>${escapeHtml(notification.displayBudget)}</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.8;"><strong>上課地點：</strong>${escapeHtml(notification.location)}</p>
        <p style="margin:0;font-size:15px;line-height:1.8;"><strong>可上課時段：</strong>${escapeHtml(notification.availableTime)}</p>
      </div>
      ${
        notification.studentDescription || notification.teacherRequirements
          ? `<div style="margin-top:20px;border-radius:18px;border:1px solid #d8ebc8;padding:20px;">
              ${notification.studentDescription ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.8;"><strong>學生狀況：</strong>${escapeHtml(notification.studentDescription)}</p>` : ''}
              ${notification.teacherRequirements ? `<p style="margin:0;font-size:15px;line-height:1.8;"><strong>教師要求：</strong>${escapeHtml(notification.teacherRequirements)}</p>` : ''}
            </div>`
          : ''
      }
      <div style="margin-top:20px;text-align:center;">
        <a href="${escapeHtml(notification.tutorCasesUrl)}" style="display:inline-block;padding:12px 28px;background:#427A5B;color:#fffdf8;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600;">前往案件專區</a>
      </div>
    `,
    footer: '此通知由青椒老師家教中心系統自動發送。如不想收到新案件通知，請至個人設定關閉通知。',
  })

const buildTutorCaseNotificationText = (notification: TutorCaseNotificationData) =>
  [
    '新案件通知',
    '',
    '案件資訊',
    `案件編號：${notification.caseNumber}`,
    `需求科目：${notification.subject}`,
    `期望預算：${notification.displayBudget}`,
    `上課地點：${notification.location}`,
    `可上課時段：${notification.availableTime}`,
    '',
    `學生狀況：${formatOptionalText(notification.studentDescription)}`,
    `教師要求：${formatOptionalText(notification.teacherRequirements)}`,
    '',
    `前往案件專區：${notification.tutorCasesUrl}`,
  ].join('\n')

// ── 收件人查詢 ──

export const loadTutorRecipientEmails = async (db: AdminDbLike = adminDb as AdminDbLike) => {
  const snapshot = await db.collection('approvedTutors').get()
  const uniqueEmails = new Set<string>()

  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    const email = normalizeText(data.email).toLowerCase()
    // ⚠️ 只通知有開啟通知且 email 有效的教師
    if (email && email.includes('@') && data.receiveNewCaseNotifications === true) {
      uniqueEmails.add(email)
    }
  })

  return [...uniqueEmails]
}

// ── 並行批次發送 ──

// 💡 Office 365 限制每分鐘 30 封
//    每批 5 封同時發，批次間隔 10 秒 → 每分鐘 30 封剛好卡在限制內
const BATCH_SIZE = 5
const BATCH_DELAY_MS = 10_000

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const sendInBatches = async <T>(
  items: T[],
  fn: (item: T) => Promise<{ success: boolean; email: string; error?: string }>,
  logTag: string = ''
) => {
  const results: { success: boolean; email: string; error?: string }[] = []
  const totalBatches = Math.ceil(items.length / BATCH_SIZE)

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    // ⚠️ 第二批開始要等待，避免觸發 SMTP 限流
    if (i > 0) {
      console.log(`${logTag} 批次 ${batchNum}/${totalBatches}：等待 ${BATCH_DELAY_MS / 1000} 秒...`)
      await delay(BATCH_DELAY_MS)
    }

    const batch = items.slice(i, i + BATCH_SIZE)
    console.log(`${logTag} 批次 ${batchNum}/${totalBatches}：發送 ${batch.length} 封`)

    // 💡 用 allSettled 而非 all — 一封失敗不影響同批其他封
    const batchResults = await Promise.allSettled(batch.map(fn))

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({ success: false, email: 'unknown', error: String(result.reason) })
      }
    }
  }

  return results
}

// ── 發送郵件 ──

export const sendTutorCaseNotificationEmail = async ({
  recipientEmails,
  notification,
}: SendTutorCaseNotificationEmailArgs) => {
  const tag = `[案件通知 ${notification.caseNumber}]`

  if (recipientEmails.length === 0) {
    console.log(`${tag} 沒有符合條件的教師收件人，跳過通知`)
    return { skipped: true, recipientCount: 0, successCount: 0, failedEmails: [] as string[] }
  }

  console.log(`${tag} 開始發送，共 ${recipientEmails.length} 位教師`)

  const transporter = getTransporter()
  const { fromEmail, fromName } = getRequiredSmtpConfig()
  const subject = `青椒老師家教中心｜新案件通知 - ${notification.subject}`
  const html = buildTutorCaseNotificationHtml(notification)
  const text = buildTutorCaseNotificationText(notification)

  const results = await sendInBatches(
    recipientEmails,
    async (email) => {
      try {
        await transporter.sendMail({
          from: `${fromName} <${fromEmail}>`,
          to: email,
          subject,
          html,
          text,
        })
        return { success: true, email }
      } catch (err) {
        console.error(`${tag} 發送給 ${email} 失敗:`, err)
        return { success: false, email, error: String(err) }
      }
    },
    tag
  )

  const successCount = results.filter((r) => r.success).length
  const failedEmails = results.filter((r) => !r.success).map((r) => r.email)
  const totalBatches = Math.ceil(recipientEmails.length / BATCH_SIZE)

  // 最終統計摘要 — 在 Vercel Function Logs 搜尋 "[案件通知" 即可找到
  console.log(
    `${tag} 發送完成：${successCount}/${recipientEmails.length} 封成功` +
    (failedEmails.length > 0 ? `，${failedEmails.length} 封失敗` : '') +
    `（共 ${totalBatches} 批）`
  )
  if (failedEmails.length > 0) {
    console.error(`${tag} 失敗的 email:`, failedEmails.join(', '))
  }

  return { skipped: false, recipientCount: recipientEmails.length, successCount, failedEmails }
}

// ── 頂層便利函式 ──

export const notifyApprovedTutors = async (
  caseData: TutorCaseNotificationSource,
  options: BuildNotificationOptions = {}
) => {
  const recipientEmails = await loadTutorRecipientEmails()
  const notification = buildTutorCaseNotificationData(caseData, options)

  return sendTutorCaseNotificationEmail({ recipientEmails, notification })
}
