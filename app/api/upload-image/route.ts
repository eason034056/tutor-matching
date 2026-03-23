import { randomUUID } from "node:crypto"

import { NextRequest, NextResponse } from "next/server"

import { adminStorage } from "@/lib/firebase/firebase-admin"
import { addWatermark } from "@/lib/imageUtils.server"

type UploadErrorCode =
  | "MISSING_PARAMS"
  | "INVALID_UPLOAD_TARGET"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_FAILED"
  | "SERVER_ERROR"

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const ALLOWED_UPLOAD_TARGETS: Record<string, Set<string>> = {
  tutors: new Set(["student-ids", "id-cards"]),
  cases: new Set(["document-follow-up"]),
}

const normalizeStorageBucket = (rawBucket: string | undefined) => {
  const trimmed = (rawBucket || "").trim().replace(/^['"]|['"]$/g, "")
  if (!trimmed) return ""
  if (trimmed.startsWith("gs://")) {
    return trimmed.replace("gs://", "").replace(/\/+$/, "")
  }
  return trimmed.replace(/\/+$/, "")
}

const sanitizeFileName = (fileName: string) => {
  const normalized = fileName.trim().toLowerCase()
  const replaced = normalized.replace(/[^a-z0-9._-]+/g, "-")
  return replaced.replace(/^-+|-+$/g, "").slice(0, 80) || "image"
}

const isFileLike = (value: FormDataEntryValue | null): value is File =>
  Boolean(value && typeof value === "object" && "arrayBuffer" in value && "size" in value && "type" in value)

const isAllowedTarget = (folder: string, subfolder: string) => {
  const allowedSubfolders = ALLOWED_UPLOAD_TARGETS[folder]
  if (!allowedSubfolders) return false
  return allowedSubfolders.has(subfolder)
}

const buildErrorResponse = (status: number, error: string, errorCode: UploadErrorCode) =>
  NextResponse.json(
    {
      success: false,
      error,
      errorCode,
    },
    { status }
  )

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const fileValue = formData.get("file")
    const folder = String(formData.get("folder") || "").trim()
    const subfolder = String(formData.get("subfolder") || "").trim()

    if (!isFileLike(fileValue) || !folder || !subfolder) {
      return buildErrorResponse(400, "缺少必要參數", "MISSING_PARAMS")
    }

    if (!isAllowedTarget(folder, subfolder)) {
      return buildErrorResponse(400, "不支援的上傳目標", "INVALID_UPLOAD_TARGET")
    }

    if (!fileValue.type.startsWith("image/")) {
      return buildErrorResponse(400, "僅支援圖片檔案", "INVALID_FILE_TYPE")
    }

    if (fileValue.size > MAX_UPLOAD_BYTES) {
      return buildErrorResponse(413, "檔案大小不可超過 20MB", "FILE_TOO_LARGE")
    }

    const fileBuffer = Buffer.from(await fileValue.arrayBuffer())
    const watermarkedBuffer = await addWatermark(fileBuffer)
    const safeName = sanitizeFileName(fileValue.name)
    const fileName = `${Date.now()}-${randomUUID()}-${safeName}`
    const filePath = `${folder}/${subfolder}/${fileName}`

    const configuredBucket = normalizeStorageBucket(
      process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    )
    const bucket = configuredBucket ? adminStorage.bucket(configuredBucket) : adminStorage.bucket()
    const uploadedFile = bucket.file(filePath)

    await uploadedFile.save(watermarkedBuffer, {
      metadata: {
        contentType: fileValue.type,
      },
    })

    const [url] = await uploadedFile.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    })

    return NextResponse.json({
      success: true,
      url,
      filePath,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "圖片上傳失敗"
    return buildErrorResponse(500, message || "圖片上傳失敗", "UPLOAD_FAILED")
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
