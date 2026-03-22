import { createTransport } from 'nodemailer'
import type { Transporter } from 'nodemailer'

import { buildLocationSummary, type LessonMode } from '@/lib/address-utils'
import { adminDb } from '@/lib/firebase/firebase-admin'

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

export interface AdminCaseReviewNotificationData {
  caseNumber: string
  parentName: string
  parentPhone: string
  parentEmail: string
  subject: string
  grade: string
  region: string
  displayAddress: string
  displayBudget: string
  availableTime: string
  studentDescription: string
  teacherRequirements: string
  message: string
  adminUrl: string
}

export interface AdminCaseReviewSource {
  caseNumber?: string
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  subject?: string
  grade?: string
  region?: string
  lessonMode?: LessonMode
  location?: string
  city?: string
  district?: string
  roadName?: string
  landmark?: string
  onlineDetail?: string
  address?: string
  hourlyFee?: string | number
  budgetRange?: string
  availableTime?: string
  studentDescription?: string
  teacherRequirements?: string
  message?: string
}

type BuildNotificationOptions = {
  siteUrl?: string
}

type SendAdminCaseReviewEmailArgs = {
  recipientEmails: string[]
  notification: AdminCaseReviewNotificationData
}

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

const buildDisplayBudget = (caseData: AdminCaseReviewSource) => {
  const budgetRange = normalizeText(caseData.budgetRange)
  if (budgetRange) {
    return budgetRange
  }

  if (typeof caseData.hourlyFee === 'string' && caseData.hourlyFee.trim()) {
    return caseData.hourlyFee.trim()
  }

  if (typeof caseData.hourlyFee === 'number' && Number.isFinite(caseData.hourlyFee)) {
    return `NT$${caseData.hourlyFee}/時`
  }

  return '未填預算'
}

const buildDisplayAddress = (caseData: AdminCaseReviewSource) => {
  const location = normalizeText(caseData.location)
  if (location) {
    return location
  }

  const structuredLocation = buildLocationSummary({
    city: caseData.city,
    district: caseData.district,
    roadName: caseData.roadName,
    landmark: caseData.landmark,
    lessonMode: caseData.lessonMode,
    onlineDetail: caseData.onlineDetail,
  })

  if (structuredLocation) {
    return structuredLocation
  }

  const legacyAddress = normalizeText(caseData.address)
  if (legacyAddress) {
    return legacyAddress
  }

  return '未填地址'
}

const buildRegion = (caseData: AdminCaseReviewSource) => {
  const explicitRegion = normalizeText(caseData.region)
  if (explicitRegion) {
    return explicitRegion
  }

  if (caseData.lessonMode === 'online') {
    return '線上'
  }

  return normalizeText(caseData.city) || '未填地區'
}

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
  if (cachedTransporter) {
    return cachedTransporter
  }

  const config = getRequiredSmtpConfig()
  cachedTransporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  return cachedTransporter
}

const buildAdminCaseReviewHtml = (notification: AdminCaseReviewNotificationData) => {
  const rows = [
    `家長姓名：${notification.parentName}`,
    `聯絡電話：${notification.parentPhone}`,
    `電子信箱：${formatOptionalText(notification.parentEmail)}`,
    `聯絡地址：${notification.displayAddress}`,
    `需求科目：${notification.subject}`,
    `學生年級：${notification.grade}`,
    `地區：${notification.region}`,
    `期望預算：${notification.displayBudget}`,
    `可上課時段：${notification.availableTime}`,
    `案件編號：${notification.caseNumber}`,
  ]

  const details = [
    `學生狀況：${formatOptionalText(notification.studentDescription)}`,
    `教師要求：${formatOptionalText(notification.teacherRequirements)}`,
    `補充說明：${formatOptionalText(notification.message)}`,
  ]

  return `
    <div style="background:#171717;padding:24px;color:#f5f5f5;font-family:'Segoe UI',sans-serif;line-height:1.7;">
      <h1 style="margin:0 0 20px;color:#5b8cff;">新案件通知</h1>
      <div style="background:#3a3a3a;border-radius:16px;padding:24px;">
        <h2 style="margin:0 0 16px;font-size:28px;">案件資訊</h2>
        ${rows.map((row) => `<p style="margin:0 0 12px;font-size:18px;">${escapeHtml(row)}</p>`).join('')}
      </div>
      <div style="background:#6f6730;border-radius:16px;padding:24px;margin-top:24px;">
        ${details.map((row) => `<p style="margin:0 0 12px;font-size:18px;">${escapeHtml(row)}</p>`).join('')}
      </div>
      <p style="margin:24px 0 0;font-size:18px;">
        <a href="${escapeHtml(notification.adminUrl)}" style="color:#5b8cff;">請登入後台審核此案件。</a>
      </p>
    </div>
  `.trim()
}

const buildAdminCaseReviewText = (notification: AdminCaseReviewNotificationData) => [
  '新案件通知',
  '',
  '案件資訊',
  `家長姓名：${notification.parentName}`,
  `聯絡電話：${notification.parentPhone}`,
  `電子信箱：${formatOptionalText(notification.parentEmail)}`,
  `聯絡地址：${notification.displayAddress}`,
  `需求科目：${notification.subject}`,
  `學生年級：${notification.grade}`,
  `地區：${notification.region}`,
  `期望預算：${notification.displayBudget}`,
  `可上課時段：${notification.availableTime}`,
  `案件編號：${notification.caseNumber}`,
  '',
  `學生狀況：${formatOptionalText(notification.studentDescription)}`,
  `教師要求：${formatOptionalText(notification.teacherRequirements)}`,
  `補充說明：${formatOptionalText(notification.message)}`,
  '',
  `請登入後台審核此案件：${notification.adminUrl}`,
].join('\n')

export const buildAdminCaseReviewNotificationData = (
  caseData: AdminCaseReviewSource,
  options: BuildNotificationOptions = {}
): AdminCaseReviewNotificationData => ({
  caseNumber: ensureValue(normalizeText(caseData.caseNumber), '未填案件編號'),
  parentName: ensureValue(normalizeText(caseData.parentName), '未填家長姓名'),
  parentPhone: ensureValue(normalizeText(caseData.parentPhone), '未填聯絡電話'),
  parentEmail: normalizeText(caseData.parentEmail),
  subject: ensureValue(normalizeText(caseData.subject), '未填需求科目'),
  grade: ensureValue(normalizeText(caseData.grade), '未填學生年級'),
  region: buildRegion(caseData),
  displayAddress: buildDisplayAddress(caseData),
  displayBudget: buildDisplayBudget(caseData),
  availableTime: ensureValue(normalizeText(caseData.availableTime), '未填可上課時段'),
  studentDescription: normalizeText(caseData.studentDescription),
  teacherRequirements: normalizeText(caseData.teacherRequirements),
  message: normalizeText(caseData.message),
  adminUrl: buildAdminUrl(options.siteUrl ?? process.env.SITE_URL),
})

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

export const sendAdminCaseReviewEmail = async ({
  recipientEmails,
  notification,
}: SendAdminCaseReviewEmailArgs) => {
  if (recipientEmails.length === 0) {
    console.log('No admin recipients configured for new case review email.')
    return { skipped: true }
  }

  const transporter = getTransporter()
  const { fromEmail, fromName } = getRequiredSmtpConfig()
  const subject = `新案件通知 - ${notification.subject}`

  const result = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: recipientEmails.join(', '),
    subject,
    html: buildAdminCaseReviewHtml(notification),
    text: buildAdminCaseReviewText(notification),
  })

  return { skipped: false, messageId: result.messageId ?? null }
}

export const notifyNewCaseAdmins = async (
  caseData: AdminCaseReviewSource,
  options: BuildNotificationOptions = {}
) => {
  const recipientEmails = await loadAdminRecipientEmails()
  const notification = buildAdminCaseReviewNotificationData(caseData, options)

  return sendAdminCaseReviewEmail({
    recipientEmails,
    notification,
  })
}
