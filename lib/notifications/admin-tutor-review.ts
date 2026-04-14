import 'server-only'

import { createTransport } from 'nodemailer'
import type { Transporter } from 'nodemailer'

import { adminDb } from '@/lib/firebase/firebase-admin'

// ── 型別定義 ──

export interface AdminTutorReviewNotificationData {
  name: string
  email: string
  phoneNumber: string
  school: string
  major: string
  subjects: string
  experience: string
  expertise: string
  tutorCode: string
  adminUrl: string
}

export interface AdminTutorReviewSource {
  name?: string | null
  email?: string | null
  phoneNumber?: string | null
  school?: string | null
  major?: string | null
  subjects?: string | string[] | null
  experience?: string | null
  expertise?: string | null
  tutorCode?: string | null
}

type BuildNotificationOptions = {
  siteUrl?: string
}

type SendAdminTutorReviewEmailArgs = {
  recipientEmails: string[]
  notification: AdminTutorReviewNotificationData
}

type AdminDbLike = {
  collection: (name: string) => {
    get: () => Promise<{
      docs: Array<{
        data: () => {
          email?: string | null
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

const buildAdminUrl = (siteUrl?: string | null) => {
  const normalized = normalizeSiteUrl(siteUrl)
  return normalized ? `${normalized}/admin` : '/admin'
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

// ── 通知資料建構 ──

const normalizeSubjects = (subjects?: string | string[] | null): string => {
  if (!subjects) return '未填'
  if (Array.isArray(subjects)) return subjects.join('、') || '未填'
  return subjects.trim() || '未填'
}

export const buildAdminTutorReviewNotificationData = (
  tutor: AdminTutorReviewSource,
  options: BuildNotificationOptions = {}
): AdminTutorReviewNotificationData => ({
  name: ensureValue(normalizeText(tutor.name), '未填姓名'),
  email: ensureValue(normalizeText(tutor.email), '未填 email'),
  phoneNumber: ensureValue(normalizeText(tutor.phoneNumber), '未填電話'),
  school: ensureValue(normalizeText(tutor.school), '未填學校'),
  major: ensureValue(normalizeText(tutor.major), '未填科系'),
  subjects: normalizeSubjects(tutor.subjects),
  experience: ensureValue(normalizeText(tutor.experience), '未填經驗'),
  expertise: ensureValue(normalizeText(tutor.expertise), '未填專長'),
  tutorCode: ensureValue(normalizeText(tutor.tutorCode), '未產生'),
  adminUrl: buildAdminUrl(options.siteUrl ?? process.env.SITE_URL),
})

// ── 郵件模板 ──

const buildAdminTutorReviewHtml = (notification: AdminTutorReviewNotificationData) => {
  const rows = [
    `教師姓名：${notification.name}`,
    `電子信箱：${notification.email}`,
    `聯絡電話：${notification.phoneNumber}`,
    `學校：${notification.school}`,
    `科系：${notification.major}`,
    `教學科目：${notification.subjects}`,
    `教師編號：${notification.tutorCode}`,
  ]

  const details = [
    `教學經驗：${formatOptionalText(notification.experience)}`,
    `專長描述：${formatOptionalText(notification.expertise)}`,
  ]

  return `
    <div style="background:#171717;padding:24px;color:#f5f5f5;font-family:'Segoe UI',sans-serif;line-height:1.7;">
      <h1 style="margin:0 0 20px;color:#5b8cff;">新教師申請通知</h1>
      <div style="background:#3a3a3a;border-radius:16px;padding:24px;">
        <h2 style="margin:0 0 16px;font-size:28px;">教師資訊</h2>
        ${rows.map((row) => `<p style="margin:0 0 12px;font-size:18px;">${escapeHtml(row)}</p>`).join('')}
      </div>
      <div style="background:#6f6730;border-radius:16px;padding:24px;margin-top:24px;">
        ${details.map((row) => `<p style="margin:0 0 12px;font-size:18px;">${escapeHtml(row)}</p>`).join('')}
      </div>
      <p style="margin:24px 0 0;font-size:18px;">
        <a href="${escapeHtml(notification.adminUrl)}" style="color:#5b8cff;">請登入後台審核此教師。</a>
      </p>
    </div>
  `.trim()
}

const buildAdminTutorReviewText = (notification: AdminTutorReviewNotificationData) => [
  '新教師申請通知',
  '',
  '教師資訊',
  `教師姓名：${notification.name}`,
  `電子信箱：${notification.email}`,
  `聯絡電話：${notification.phoneNumber}`,
  `學校：${notification.school}`,
  `科系：${notification.major}`,
  `教學科目：${notification.subjects}`,
  `教師編號：${notification.tutorCode}`,
  '',
  `教學經驗：${formatOptionalText(notification.experience)}`,
  `專長描述：${formatOptionalText(notification.expertise)}`,
  '',
  `請登入後台審核此教師：${notification.adminUrl}`,
].join('\n')

// ── 收件人查詢 ──

export const loadAdminRecipientEmails = async (db: AdminDbLike = adminDb as AdminDbLike) => {
  const snapshot = await db.collection('admins').get()
  const uniqueEmails = new Set<string>()

  snapshot.docs.forEach((doc) => {
    const email = normalizeText(doc.data().email).toLowerCase()
    if (email && email.includes('@')) {
      uniqueEmails.add(email)
    }
  })

  return [...uniqueEmails]
}

// ── 發送郵件 ──

export const sendAdminTutorReviewEmail = async ({
  recipientEmails,
  notification,
}: SendAdminTutorReviewEmailArgs) => {
  if (recipientEmails.length === 0) {
    console.log('[教師申請通知] 沒有管理員收件人，跳過通知')
    return { skipped: true }
  }

  const transporter = getTransporter()
  const { fromEmail, fromName } = getRequiredSmtpConfig()
  const subject = `新教師申請通知 - ${notification.name}`

  const result = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: recipientEmails.join(', '),
    subject,
    html: buildAdminTutorReviewHtml(notification),
    text: buildAdminTutorReviewText(notification),
  })

  console.log(`[教師申請通知] 已通知管理員，教師：${notification.name}（${notification.tutorCode}）`)
  return { skipped: false, messageId: result.messageId ?? null }
}

// ── 頂層便利函式 ──

export const notifyNewTutorAdmins = async (
  tutorData: AdminTutorReviewSource,
  options: BuildNotificationOptions = {}
) => {
  const recipientEmails = await loadAdminRecipientEmails()
  const notification = buildAdminTutorReviewNotificationData(tutorData, options)

  return sendAdminTutorReviewEmail({ recipientEmails, notification })
}
