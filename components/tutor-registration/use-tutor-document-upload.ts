"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { processImageComplete } from "@/lib/imageUtils"
import {
  type DocumentFieldName,
  type DocumentUploadErrorCode,
  type TutorDocumentUploadSlots,
  TUTOR_DOCUMENT_UPLOAD_META,
  createInitialTutorDocumentSlots,
  getTutorDocumentSubmissionUrls,
  hasTutorDocumentUploadInFlight,
  transitionTutorDocumentSlot,
} from "@/lib/tutor-document-upload"

type ExistingDocuments = {
  studentIdCardUrl?: string
  idCardUrl?: string
}

type UploadApiResponse = {
  success?: boolean
  url?: string
  filePath?: string
  error?: string
  errorCode?: DocumentUploadErrorCode
}

type UploadFailure = Error & {
  code?: DocumentUploadErrorCode
}

const MAX_RAW_FILE_SIZE_BYTES = 20 * 1024 * 1024
const imageExtensionPattern = /\.(jpe?g|png|webp|avif|heic|heif)$/i

const readJsonResponse = async (response: Response): Promise<UploadApiResponse> => {
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    return { error: "伺服器回應格式錯誤", errorCode: "SERVER_ERROR" }
  }

  return response.json()
}

const buildUploadFailure = (result: UploadApiResponse, fallbackMessage: string): UploadFailure => {
  const error = new Error(result.error || fallbackMessage) as UploadFailure
  error.code = result.errorCode || "UPLOAD_FAILED"
  return error
}

const normalizeUploadFailure = (error: unknown): UploadFailure => {
  if (error instanceof Error) {
    const uploadFailure = error as UploadFailure
    uploadFailure.code = uploadFailure.code || "UNKNOWN"
    return uploadFailure
  }

  const unknownError = new Error("圖片上傳失敗，請稍後再試。") as UploadFailure
  unknownError.code = "UNKNOWN"
  return unknownError
}

const isImageFile = (file: File) =>
  file.type.startsWith("image/") || imageExtensionPattern.test(file.name)

const validateFileBeforeUpload = (file: File) => {
  if (!isImageFile(file)) {
    return {
      valid: false,
      error: "請選擇圖片檔案（JPG、PNG、WebP、HEIC）。",
      errorCode: "INVALID_FILE_TYPE" as DocumentUploadErrorCode,
    }
  }

  if (file.size > MAX_RAW_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "原始圖片不可超過 20MB，請先壓縮後再試。",
      errorCode: "FILE_TOO_LARGE" as DocumentUploadErrorCode,
    }
  }

  return { valid: true as const }
}

const createEmptyFileMap = () => ({
  studentIdCard: null,
  idCard: null,
}) as Record<DocumentFieldName, File | null>

const createEmptyPreviewMap = () => ({
  studentIdCard: "",
  idCard: "",
}) as Record<DocumentFieldName, string>

export const useTutorDocumentUpload = (existingDocuments: ExistingDocuments = {}) => {
  const existingDocumentSnapshot = useMemo(
    () => ({
      studentIdCardUrl: existingDocuments.studentIdCardUrl || "",
      idCardUrl: existingDocuments.idCardUrl || "",
    }),
    [existingDocuments.idCardUrl, existingDocuments.studentIdCardUrl]
  )

  const [slots, setSlots] = useState<TutorDocumentUploadSlots>(() =>
    createInitialTutorDocumentSlots(existingDocumentSnapshot)
  )
  const fileCacheRef = useRef<Record<DocumentFieldName, File | null>>(createEmptyFileMap())
  const previewUrlCacheRef = useRef<Record<DocumentFieldName, string>>(createEmptyPreviewMap())

  const updateSlot = useCallback(
    (
      fieldName: DocumentFieldName,
      transition: Parameters<typeof transitionTutorDocumentSlot>[1]
    ) => {
      setSlots((current) => ({
        ...current,
        [fieldName]: transitionTutorDocumentSlot(current[fieldName], transition),
      }))
    },
    []
  )

  const replacePreviewUrl = useCallback((fieldName: DocumentFieldName, nextPreviewUrl: string) => {
    const previousUrl = previewUrlCacheRef.current[fieldName]
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl)
    }

    previewUrlCacheRef.current[fieldName] = nextPreviewUrl
  }, [])

  const uploadProcessedFile = useCallback(async (fieldName: DocumentFieldName, file: File) => {
    const meta = TUTOR_DOCUMENT_UPLOAD_META[fieldName]
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", meta.folder)
    formData.append("subfolder", meta.subfolder)

    let response: Response
    try {
      response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })
    } catch {
      const networkError = new Error("網路連線不穩定，請稍後重試。") as UploadFailure
      networkError.code = "NETWORK_ERROR"
      throw networkError
    }

    const result = await readJsonResponse(response)
    if (!response.ok || !result.url) {
      throw buildUploadFailure(result, "圖片上傳失敗")
    }

    return {
      url: String(result.url),
      filePath: String(result.filePath || ""),
    }
  }, [])

  const uploadFieldFile = useCallback(
    async (fieldName: DocumentFieldName, file: File, isRetry = false) => {
      const meta = TUTOR_DOCUMENT_UPLOAD_META[fieldName]
      const currentPreviewUrl = previewUrlCacheRef.current[fieldName]

      updateSlot(fieldName, {
        type: "startProcessing",
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        previewUrl: currentPreviewUrl,
      })

      try {
        const processedFile = await processImageComplete(file, 5)
        const previewUrl = URL.createObjectURL(processedFile)
        replacePreviewUrl(fieldName, previewUrl)
        fileCacheRef.current[fieldName] = processedFile

        updateSlot(fieldName, {
          type: "startProcessing",
          fileName: processedFile.name,
          fileSize: processedFile.size,
          fileType: processedFile.type,
          previewUrl,
        })

        updateSlot(fieldName, { type: "startUploading" })
        const uploaded = await uploadProcessedFile(fieldName, processedFile)
        updateSlot(fieldName, {
          type: "uploadSucceeded",
          uploadedUrl: uploaded.url,
          filePath: uploaded.filePath,
        })

        toast.success(`${meta.label}${isRetry ? "重試" : ""}上傳成功`)
      } catch (error) {
        const uploadFailure = normalizeUploadFailure(error)
        updateSlot(fieldName, {
          type: "uploadFailed",
          error: uploadFailure.message,
          errorCode: uploadFailure.code,
        })
        toast.error(uploadFailure.message)
      }
    },
    [replacePreviewUrl, updateSlot, uploadProcessedFile]
  )

  const selectFile = useCallback(
    async (fieldName: DocumentFieldName, file: File) => {
      const validation = validateFileBeforeUpload(file)
      if (!validation.valid) {
        updateSlot(fieldName, {
          type: "setError",
          error: validation.error,
          errorCode: validation.errorCode,
        })
        toast.error(validation.error)
        return
      }

      await uploadFieldFile(fieldName, file, false)
    },
    [updateSlot, uploadFieldFile]
  )

  const retryUpload = useCallback(
    async (fieldName: DocumentFieldName) => {
      const file = fileCacheRef.current[fieldName]
      if (!file) {
        const fallbackMessage = "找不到可重試的圖片，請重新選擇檔案。"
        updateSlot(fieldName, { type: "setError", error: fallbackMessage, errorCode: "UNKNOWN" })
        toast.error(fallbackMessage)
        return
      }

      await uploadFieldFile(fieldName, file, true)
    },
    [updateSlot, uploadFieldFile]
  )

  const resetUploads = useCallback(() => {
    const previewUrls = Object.values(previewUrlCacheRef.current)
    for (const previewUrl of previewUrls) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }

    previewUrlCacheRef.current = createEmptyPreviewMap()
    fileCacheRef.current = createEmptyFileMap()
    setSlots(createInitialTutorDocumentSlots(existingDocumentSnapshot))
  }, [existingDocumentSnapshot])

  useEffect(() => {
    const previewUrls = Object.values(previewUrlCacheRef.current)
    for (const previewUrl of previewUrls) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }

    setSlots(createInitialTutorDocumentSlots(existingDocumentSnapshot))
    fileCacheRef.current = createEmptyFileMap()
    previewUrlCacheRef.current = createEmptyPreviewMap()
  }, [existingDocumentSnapshot])

  useEffect(
    () => () => {
      const previewUrls = Object.values(previewUrlCacheRef.current)
      for (const previewUrl of previewUrls) {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
      }
    },
    []
  )

  return {
    slots,
    isAnyUploading: hasTutorDocumentUploadInFlight(slots),
    selectFile,
    retryUpload,
    resetUploads,
    getSubmissionDocumentUrls: () => getTutorDocumentSubmissionUrls(slots),
  }
}
