export const TUTOR_REVISION_REASON_LABELS = {
  basic_info_incomplete: '基本資料填寫不完整',
  subjects_unclear: '授課科目與年級描述不夠清楚',
  experience_unclear: '教學經驗說明不足',
  school_info_unclear: '學校或科系資訊不完整',
  student_id_unreadable: '學生證照片無法清楚辨識',
  id_card_unreadable: '身分證照片無法清楚辨識',
  info_mismatch: '填寫資料與證件資訊不一致',
  other: '其他需要補充的內容',
} as const

export type TutorRevisionReasonCode = keyof typeof TUTOR_REVISION_REASON_LABELS

export const TUTOR_REVISION_REASON_OPTIONS = (Object.entries(TUTOR_REVISION_REASON_LABELS) as Array<
  [TutorRevisionReasonCode, string]
>).map(([code, label]) => ({
  code,
  label,
}))

const normalizeText = (value?: string | null) => value?.trim() || ''

const isTutorRevisionReasonCode = (value: string): value is TutorRevisionReasonCode =>
  value in TUTOR_REVISION_REASON_LABELS

export const getTutorRevisionReasonLabel = (code: TutorRevisionReasonCode) => TUTOR_REVISION_REASON_LABELS[code]

export const normalizeTutorRevisionReasonCodes = (reasonCodes: unknown) => {
  if (!Array.isArray(reasonCodes)) {
    return [] as TutorRevisionReasonCode[]
  }

  const uniqueCodes = new Set<TutorRevisionReasonCode>()

  for (const value of reasonCodes) {
    if (typeof value === 'string' && isTutorRevisionReasonCode(value)) {
      uniqueCodes.add(value)
    }
  }

  return [...uniqueCodes]
}

export const validateTutorRevisionRequest = ({
  reasonCodes,
  note,
}: {
  reasonCodes: unknown
  note?: string | null
}) => {
  const normalizedReasonCodes = normalizeTutorRevisionReasonCodes(reasonCodes)
  const normalizedNote = normalizeText(note)

  if (normalizedReasonCodes.length === 0) {
    throw new Error('請至少選擇一個退件理由')
  }

  if (normalizedReasonCodes.includes('other') && !normalizedNote) {
    throw new Error('請補充退件說明')
  }

  return {
    reasonCodes: normalizedReasonCodes,
    note: normalizedNote,
  }
}

export const formatTutorRevisionExpiry = (expiresAt?: string | null) => {
  const normalized = normalizeText(expiresAt)
  if (!normalized) {
    return '請於有效期限內完成補件'
  }

  return new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Taipei',
  }).format(new Date(normalized))
}
