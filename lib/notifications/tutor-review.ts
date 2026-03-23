import 'server-only'

import { createTransport } from 'nodemailer'
import type { Transporter } from 'nodemailer'

import {
  formatTutorRevisionExpiry,
  getTutorRevisionReasonLabel,
  type TutorRevisionReasonCode,
} from '../tutor-review'

export { validateTutorRevisionRequest } from '../tutor-review'

export interface TutorApprovalNotificationData {
  name: string
  tutorCode: string
  processUrl: string
  tutorCasesUrl: string
  lineId: string
  receiveNewCaseNotifications: boolean
}

export interface TutorRevisionRequestNotificationData {
  name: string
  reasonLabels: string[]
  revisionNote: string
  revisionUrl: string
  formattedExpiry: string
}

type TutorApprovalSource = {
  name?: string | null
  tutorCode?: string | null
  receiveNewCaseNotifications?: boolean | null
}

type TutorRevisionSource = {
  name?: string | null
  revisionReasonCodes?: TutorRevisionReasonCode[]
  revisionNote?: string | null
  revisionPath?: string | null
  revisionExpiresAt?: string | null
}

type BuildNotificationOptions = {
  siteUrl?: string
}

type SendTutorApprovalEmailArgs = {
  recipientEmail: string
  notification: TutorApprovalNotificationData
}

type SendTutorRevisionRequestEmailArgs = {
  recipientEmail: string
  notification: TutorRevisionRequestNotificationData
}

let cachedTransporter: Transporter | null = null

const smtpEnvKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'] as const

const normalizeText = (value?: string | null) => value?.trim() || ''

const normalizeBool = (value?: string | null) => String(value).toLowerCase() === 'true'

const ensureValue = (value: string, fallback: string) => value || fallback

const normalizeSiteUrl = (siteUrl?: string | null) => siteUrl?.trim().replace(/\/+$/, '') || ''

const buildAbsoluteUrl = (siteUrl: string | undefined, path: string) => {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl)
  if (!normalizedSiteUrl) {
    return path
  }

  return `${normalizedSiteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

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

export const buildTutorApprovalNotificationData = (
  tutor: TutorApprovalSource,
  options: BuildNotificationOptions = {}
): TutorApprovalNotificationData => ({
  name: ensureValue(normalizeText(tutor.name), '老師'),
  tutorCode: ensureValue(normalizeText(tutor.tutorCode), '尚未提供'),
  processUrl: buildAbsoluteUrl(options.siteUrl, '/process'),
  tutorCasesUrl: buildAbsoluteUrl(options.siteUrl, '/tutor-cases'),
  lineId: 'home-tutor-tw',
  receiveNewCaseNotifications: Boolean(tutor.receiveNewCaseNotifications),
})

export const buildTutorRevisionRequestNotificationData = (
  tutor: TutorRevisionSource,
  options: BuildNotificationOptions = {}
): TutorRevisionRequestNotificationData => ({
  name: ensureValue(normalizeText(tutor.name), '老師'),
  reasonLabels: (tutor.revisionReasonCodes || []).map(getTutorRevisionReasonLabel),
  revisionNote: normalizeText(tutor.revisionNote),
  revisionUrl: buildAbsoluteUrl(options.siteUrl, normalizeText(tutor.revisionPath) || '/tutor-registration'),
  formattedExpiry: formatTutorRevisionExpiry(tutor.revisionExpiresAt),
})

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

const buildTutorApprovalHtml = (notification: TutorApprovalNotificationData) =>
  buildEmailShell({
    eyebrow: 'TUTOR APPROVAL',
    title: '教師審核已通過',
    intro: `${notification.name} 您好，恭喜您已通過青椒老師家教中心的教師審核。`,
    content: `
      <div style="border-radius:18px;background:#eef5e8;padding:20px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.8;"><strong>教師編號：</strong>${escapeHtml(notification.tutorCode)}</p>
        <p style="margin:0;font-size:15px;line-height:1.8;">請妥善保存教師編號，之後接案與聯繫都會用到。</p>
      </div>
      <div style="margin-top:20px;border-radius:18px;border:1px solid #d8ebc8;padding:20px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.8;"><strong>下一步</strong></p>
        <p style="margin:0 0 10px;font-size:15px;line-height:1.8;">1. 查看接案流程：<a href="${escapeHtml(notification.processUrl)}" style="color:#427A5B;">${escapeHtml(notification.processUrl)}</a></p>
        <p style="margin:0 0 10px;font-size:15px;line-height:1.8;">2. 前往案件專區：<a href="${escapeHtml(notification.tutorCasesUrl)}" style="color:#427A5B;">${escapeHtml(notification.tutorCasesUrl)}</a></p>
        <p style="margin:0;font-size:15px;line-height:1.8;">3. 加入 LINE 並提供教師編號：${escapeHtml(notification.lineId)}</p>
      </div>
      ${
        notification.receiveNewCaseNotifications
          ? '<p style="margin:20px 0 0;font-size:14px;line-height:1.8;color:#3a6b50;">你目前已開啟新案件 email 通知，若有符合條件的新案，系統會主動通知你。</p>'
          : ''
      }
    `,
    footer: '青椒老師家教中心會透過本信箱寄送後續教師通知，如有疑問可直接回信或透過 LINE 聯繫。',
  })

const buildTutorApprovalText = (notification: TutorApprovalNotificationData) =>
  [
    '教師審核已通過',
    '',
    `${notification.name} 您好，恭喜您已通過青椒老師家教中心的教師審核。`,
    `教師編號：${notification.tutorCode}`,
    '',
    `接案流程：${notification.processUrl}`,
    `案件專區：${notification.tutorCasesUrl}`,
    `LINE：${notification.lineId}`,
    notification.receiveNewCaseNotifications ? '你目前已開啟新案件 email 通知。' : '',
  ]
    .filter(Boolean)
    .join('\n')

const buildTutorRevisionRequestHtml = (notification: TutorRevisionRequestNotificationData) =>
  buildEmailShell({
    eyebrow: 'REVISION REQUEST',
    title: '申請資料需要補充後重新送審',
    intro: `${notification.name} 您好，我們已完成初步審核，這次申請還需要補充以下內容後再重新送審。`,
    content: `
      <div style="border-radius:18px;background:#fff7ed;border:1px solid #f5d0a9;padding:20px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.8;"><strong>需要補充的項目</strong></p>
        <ul style="margin:0;padding-left:20px;color:#7c2d12;">
          ${notification.reasonLabels.map((label) => `<li style="margin:0 0 8px;line-height:1.8;">${escapeHtml(label)}</li>`).join('')}
        </ul>
      </div>
      ${
        notification.revisionNote
          ? `<div style="margin-top:20px;border-radius:18px;border:1px solid #d8ebc8;padding:20px;"><p style="margin:0 0 8px;font-size:15px;line-height:1.8;"><strong>補充說明</strong></p><p style="margin:0;font-size:15px;line-height:1.8;">${escapeHtml(notification.revisionNote)}</p></div>`
          : ''
      }
      <div style="margin-top:20px;border-radius:18px;background:#eef5e8;padding:20px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.8;"><strong>補件連結</strong></p>
        <p style="margin:0 0 10px;font-size:15px;line-height:1.8;"><a href="${escapeHtml(notification.revisionUrl)}" style="color:#427A5B;">${escapeHtml(notification.revisionUrl)}</a></p>
        <p style="margin:0;font-size:14px;line-height:1.8;color:#3a6b50;">請於 ${escapeHtml(notification.formattedExpiry)} 前完成補件與重新送審。</p>
      </div>
    `,
    footer: '若需要協助，請直接回信或透過 LINE：home-tutor-tw 與青椒老師家教中心聯繫。',
  })

const buildTutorRevisionRequestText = (notification: TutorRevisionRequestNotificationData) =>
  [
    '申請資料需要補充後重新送審',
    '',
    `${notification.name} 您好，這次申請仍需補充以下內容：`,
    ...notification.reasonLabels.map((label) => `- ${label}`),
    notification.revisionNote ? `補充說明：${notification.revisionNote}` : '',
    `補件連結：${notification.revisionUrl}`,
    `請於 ${notification.formattedExpiry} 前完成補件。`,
    'LINE：home-tutor-tw',
  ]
    .filter(Boolean)
    .join('\n')

export const sendTutorApprovalEmail = async ({ recipientEmail, notification }: SendTutorApprovalEmailArgs) => {
  const { fromEmail, fromName } = getRequiredSmtpConfig()
  const transporter = getTransporter()

  return transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: recipientEmail,
    subject: '青椒老師家教中心｜教師審核已通過',
    html: buildTutorApprovalHtml(notification),
    text: buildTutorApprovalText(notification),
  })
}

export const sendTutorRevisionRequestEmail = async ({
  recipientEmail,
  notification,
}: SendTutorRevisionRequestEmailArgs) => {
  const { fromEmail, fromName } = getRequiredSmtpConfig()
  const transporter = getTransporter()

  return transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: recipientEmail,
    subject: '青椒老師家教中心｜請補件後重新送審',
    html: buildTutorRevisionRequestHtml(notification),
    text: buildTutorRevisionRequestText(notification),
  })
}
