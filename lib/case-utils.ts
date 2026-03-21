import { buildLocationSummary, type LessonMode } from '@/lib/address-utils'
import type { ApprovedCase, CaseNotificationData, TutorCase } from '@/server/types'

export type CaseDocumentStatus = 'not_requested' | 'requested' | 'submitted'

export type CaseLike = Partial<TutorCase> &
  Partial<Omit<ApprovedCase, 'documentStatus'>> &
  Partial<CaseNotificationData> & {
  city?: string | null
  district?: string | null
  roadName?: string | null
  landmark?: string | null
  lessonMode?: LessonMode | null
  onlineDetail?: string | null
  documentStatus?: CaseDocumentStatus | null
  documentRequestedAt?: string | null
  documentRequestExpiresAt?: string | null
  documentSubmittedAt?: string | null
  idCardUrl?: string | null
  idNumber?: string | null
}

export const DOCUMENT_STATUS_META: Record<
  CaseDocumentStatus,
  { label: string; tone: 'muted' | 'warning' | 'success' }
> = {
  not_requested: { label: '待補件', tone: 'muted' },
  requested: { label: '已通知', tone: 'warning' },
  submitted: { label: '已完成', tone: 'success' },
}

export const normalizeBudgetRange = (budgetRange?: string | null, hourlyFee?: number | null) => {
  if (budgetRange?.trim()) {
    return budgetRange.trim()
  }

  if (typeof hourlyFee === 'number' && Number.isFinite(hourlyFee)) {
    return `NT$${hourlyFee}/時`
  }

  return '未填預算'
}

export const normalizeDocumentStatus = (caseData: CaseLike): CaseDocumentStatus => {
  if (caseData.documentStatus) {
    return caseData.documentStatus
  }

  if (caseData.idCardUrl || caseData.idNumber) {
    return 'submitted'
  }

  return 'not_requested'
}

export const getLessonMode = (caseData: CaseLike): LessonMode =>
  caseData.lessonMode ?? (caseData.region === '線上' ? 'online' : 'in_person')

export const normalizeCase = <T extends CaseLike>(caseData: T) => {
  const lessonMode = getLessonMode(caseData)
  const documentStatus = normalizeDocumentStatus(caseData)
  const locationSummary =
    caseData.location?.trim() ||
    buildLocationSummary({
      city: caseData.city,
      district: caseData.district,
      roadName: caseData.roadName,
      landmark: caseData.landmark,
      lessonMode,
      onlineDetail: caseData.onlineDetail,
    })

  return {
    ...caseData,
    lessonMode,
    location: locationSummary,
    budgetRange: normalizeBudgetRange(caseData.budgetRange, caseData.hourlyFee),
    documentStatus,
    documentStatusLabel: DOCUMENT_STATUS_META[documentStatus].label,
    documentStatusTone: DOCUMENT_STATUS_META[documentStatus].tone,
    hasDocumentLink: documentStatus === 'requested',
    isDocumentComplete: documentStatus === 'submitted',
  }
}

export const buildCaseNotificationData = (caseData: CaseLike): CaseNotificationData => {
  const normalized = normalizeCase(caseData)

  return {
    caseNumber: normalized.caseNumber || '',
    subject: normalized.subject || '',
    budgetRange: normalized.budgetRange,
    hourlyFee: normalized.hourlyFee,
    location: normalized.location || '',
    availableTime: normalized.availableTime || '',
    teacherRequirements: normalized.teacherRequirements || '',
    studentDescription: normalized.studentDescription || '',
  }
}
