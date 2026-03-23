export type DocumentFieldName = 'studentIdCard' | 'idCard'

export type DocumentUploadState = 'idle' | 'processing' | 'uploading' | 'uploaded' | 'failed'

export type DocumentUploadErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'INVALID_UPLOAD_TARGET'
  | 'UPLOAD_FAILED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN'

export type TutorDocumentUploadSlot = {
  fieldName: DocumentFieldName
  label: string
  folder: string
  subfolder: string
  state: DocumentUploadState
  error: string
  errorCode?: DocumentUploadErrorCode
  retryCount: number
  previewUrl: string
  uploadedUrl: string
  filePath: string
  selectedFileName: string
  selectedFileSize: number
  selectedFileType: string
}

export type TutorDocumentUploadSlots = Record<DocumentFieldName, TutorDocumentUploadSlot>

export const TUTOR_DOCUMENT_UPLOAD_META: Record<
  DocumentFieldName,
  { label: string; folder: string; subfolder: string; existingLabel: string; helper: string }
> = {
  studentIdCard: {
    label: '學生證照片',
    folder: 'tutors',
    subfolder: 'student-ids',
    existingLabel: '目前保存的學生證照片',
    helper: '需清楚顯示姓名與學校，避免反光與遮擋。',
  },
  idCard: {
    label: '身分證照片',
    folder: 'tutors',
    subfolder: 'id-cards',
    existingLabel: '目前保存的身分證照片',
    helper: '請上傳可辨識文字與證號的照片。',
  },
}

type ExistingDocumentUrls = {
  studentIdCardUrl?: string
  idCardUrl?: string
}

export const createTutorDocumentUploadSlot = (
  fieldName: DocumentFieldName,
  existingUrl?: string
): TutorDocumentUploadSlot => {
  const meta = TUTOR_DOCUMENT_UPLOAD_META[fieldName]
  const uploadedUrl = (existingUrl || '').trim()

  return {
    fieldName,
    label: meta.label,
    folder: meta.folder,
    subfolder: meta.subfolder,
    state: uploadedUrl ? 'uploaded' : 'idle',
    error: '',
    retryCount: 0,
    previewUrl: '',
    uploadedUrl,
    filePath: '',
    selectedFileName: '',
    selectedFileSize: 0,
    selectedFileType: '',
  }
}

export const createInitialTutorDocumentSlots = (
  existingDocuments: ExistingDocumentUrls = {}
): TutorDocumentUploadSlots => ({
  studentIdCard: createTutorDocumentUploadSlot('studentIdCard', existingDocuments.studentIdCardUrl),
  idCard: createTutorDocumentUploadSlot('idCard', existingDocuments.idCardUrl),
})

export type TutorDocumentUploadTransition =
  | { type: 'startProcessing'; fileName: string; fileSize: number; fileType: string; previewUrl: string }
  | { type: 'startUploading' }
  | { type: 'uploadSucceeded'; uploadedUrl: string; filePath: string }
  | { type: 'uploadFailed'; error: string; errorCode?: DocumentUploadErrorCode }
  | { type: 'setError'; error: string; errorCode?: DocumentUploadErrorCode }
  | { type: 'setIdle' }
  | { type: 'clearError' }

export const transitionTutorDocumentSlot = (
  slot: TutorDocumentUploadSlot,
  transition: TutorDocumentUploadTransition
): TutorDocumentUploadSlot => {
  if (transition.type === 'startProcessing') {
    return {
      ...slot,
      state: 'processing',
      error: '',
      errorCode: undefined,
      selectedFileName: transition.fileName,
      selectedFileSize: transition.fileSize,
      selectedFileType: transition.fileType,
      previewUrl: transition.previewUrl,
      uploadedUrl: '',
      filePath: '',
    }
  }

  if (transition.type === 'startUploading') {
    return {
      ...slot,
      state: 'uploading',
      error: '',
      errorCode: undefined,
    }
  }

  if (transition.type === 'uploadSucceeded') {
    return {
      ...slot,
      state: 'uploaded',
      error: '',
      errorCode: undefined,
      uploadedUrl: transition.uploadedUrl,
      filePath: transition.filePath,
    }
  }

  if (transition.type === 'uploadFailed') {
    return {
      ...slot,
      state: 'failed',
      error: transition.error,
      errorCode: transition.errorCode,
      retryCount: slot.retryCount + 1,
      uploadedUrl: '',
      filePath: '',
    }
  }

  if (transition.type === 'setError') {
    return {
      ...slot,
      error: transition.error,
      errorCode: transition.errorCode,
    }
  }

  if (transition.type === 'clearError') {
    return {
      ...slot,
      error: '',
      errorCode: undefined,
    }
  }

  return {
    ...slot,
    state: slot.uploadedUrl ? 'uploaded' : 'idle',
    error: '',
    errorCode: undefined,
  }
}

export const isUploadInFlight = (state: DocumentUploadState) =>
  state === 'processing' || state === 'uploading'

export const isSlotReadyForSubmit = (slot: TutorDocumentUploadSlot) =>
  slot.state === 'uploaded' && slot.uploadedUrl.length > 0

export const canSubmitTutorDocuments = (
  slots: TutorDocumentUploadSlots,
  requiredFields: DocumentFieldName[] = ['studentIdCard', 'idCard']
) => {
  for (const field of requiredFields) {
    if (!isSlotReadyForSubmit(slots[field])) {
      return false
    }
  }

  return true
}

export const hasTutorDocumentUploadInFlight = (slots: TutorDocumentUploadSlots) =>
  Object.values(slots).some((slot) => isUploadInFlight(slot.state))

export const getTutorDocumentSubmissionUrls = (
  slots: TutorDocumentUploadSlots
): { studentIdCardUrl: string; idCardUrl: string } | null => {
  if (!canSubmitTutorDocuments(slots)) {
    return null
  }

  return {
    studentIdCardUrl: slots.studentIdCard.uploadedUrl,
    idCardUrl: slots.idCard.uploadedUrl,
  }
}
