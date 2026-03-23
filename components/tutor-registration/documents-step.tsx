"use client"

import Image from "next/image"
import type { UseFormReturn } from "react-hook-form"
import { CreditCard, FileText, GraduationCap, Loader2, RefreshCcw, UploadCloud } from "lucide-react"

import TermsDialog from "@/components/TermsDialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  type DocumentFieldName,
  type TutorDocumentUploadSlot,
  type TutorDocumentUploadSlots,
  TUTOR_DOCUMENT_UPLOAD_META,
} from "@/lib/tutor-document-upload"
import type { TutorFormValues } from "@/lib/tutor-form"

type DocumentsStepProps = {
  form: UseFormReturn<TutorFormValues>
  isResubmission: boolean
  slots: TutorDocumentUploadSlots
  onSelectFile: (fieldName: DocumentFieldName, file: File) => Promise<void>
  onRetryUpload: (fieldName: DocumentFieldName) => Promise<void>
}

const statusLabelMap: Record<TutorDocumentUploadSlot["state"], string> = {
  idle: "尚未上傳",
  processing: "處理圖片中",
  uploading: "上傳中",
  uploaded: "已完成",
  failed: "上傳失敗",
}

const statusClassMap: Record<TutorDocumentUploadSlot["state"], string> = {
  idle: "bg-white text-neutral-600 border border-neutral-200",
  processing: "bg-brand-50 text-brand-700 border border-brand-200",
  uploading: "bg-brand-50 text-brand-700 border border-brand-200",
  uploaded: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed: "bg-red-50 text-red-700 border border-red-200",
}

const uploadFields: Array<{ fieldName: DocumentFieldName; icon: typeof GraduationCap }> = [
  { fieldName: "studentIdCard", icon: GraduationCap },
  { fieldName: "idCard", icon: CreditCard },
]

const isWorkingState = (state: TutorDocumentUploadSlot["state"]) =>
  state === "processing" || state === "uploading"

const formatFileInfo = (slot: TutorDocumentUploadSlot) => {
  if (!slot.selectedFileName || !slot.selectedFileSize) {
    return ""
  }

  const sizeMb = (slot.selectedFileSize / (1024 * 1024)).toFixed(2)
  return `${slot.selectedFileName} (${sizeMb} MB)`
}

export default function DocumentsStep({
  form,
  isResubmission,
  slots,
  onSelectFile,
  onRetryUpload,
}: DocumentsStepProps) {
  return (
    <section className="space-y-5 rounded-[1.8rem] border border-brand-100 bg-white/95 p-5 shadow-[0_18px_50px_rgba(67,102,78,0.06)] md:p-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.22em] text-brand-500">STEP 3</p>
        <h2 className="mt-2 font-display text-2xl text-brand-900 md:text-3xl">上傳證件並完成送出</h2>
        <p className="mt-2 text-sm leading-7 text-neutral-600">
          每張證件會在你選檔後立即上傳，失敗可單張重試，不需整份表單重填。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {uploadFields.map(({ fieldName, icon: Icon }) => {
          const slot = slots[fieldName]
          const meta = TUTOR_DOCUMENT_UPLOAD_META[fieldName]
          const inputId = `${fieldName}-upload`
          const previewUrl = slot.previewUrl || slot.uploadedUrl
          const fileInfo = formatFileInfo(slot)

          return (
            <article
              key={fieldName}
              className="rounded-[1.5rem] border border-brand-100 bg-[#fffdf8] p-4 shadow-[0_12px_30px_rgba(67,102,78,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-900">{meta.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">{meta.helper}</p>
                  </div>
                </div>
                <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold ${statusClassMap[slot.state]}`}>
                  {statusLabelMap[slot.state]}
                </span>
              </div>

              <div className="mt-4 rounded-[1.2rem] border border-dashed border-brand-300 bg-white p-4">
                <label
                  htmlFor={inputId}
                  className="flex min-h-[10rem] cursor-pointer flex-col items-center justify-center rounded-[1.1rem] border border-dashed border-brand-200 bg-[#f8f5ea] px-4 py-5 text-center transition-colors hover:border-brand-400 hover:bg-brand-50"
                >
                  {isWorkingState(slot.state) ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                      <div className="mt-3 text-sm font-semibold text-brand-900">
                        {slot.state === "processing" ? "正在處理圖片..." : "正在上傳圖片..."}
                      </div>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-8 w-8 text-brand-600" />
                      <div className="mt-3 text-sm font-semibold text-brand-900">點擊選擇圖片（選檔即上傳）</div>
                      <div className="mt-2 text-xs leading-6 text-neutral-500">支援 JPG、PNG、WebP、HEIC，原始檔案上限 20MB</div>
                    </>
                  )}
                </label>
                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={isWorkingState(slot.state)}
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    event.currentTarget.value = ""
                    if (!file) return
                    await onSelectFile(fieldName, file)
                  }}
                />

                {fileInfo ? <div className="mt-3 text-xs text-neutral-500">{fileInfo}</div> : null}
                {slot.error ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{slot.error}</div>
                ) : null}
                {slot.state === "failed" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50"
                    onClick={() => onRetryUpload(fieldName)}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    重試上傳
                  </Button>
                ) : null}

                {previewUrl ? (
                  <div className="relative mt-4 overflow-hidden rounded-[1.1rem] border border-brand-100 bg-white">
                    <Image
                      src={previewUrl}
                      alt={meta.label}
                      width={1200}
                      height={720}
                      unoptimized={previewUrl.startsWith("blob:")}
                      className="w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.14)_100%)]">
                      <div className="rotate-[-16deg] rounded-xl border border-white/45 bg-black/35 px-4 py-2 text-center text-[11px] font-semibold tracking-[0.18em] text-white/90">
                        僅供青椒老師家教中心使用
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>

      {!isResubmission ? (
        <FormField
          control={form.control}
          name="agreedToTerms"
          render={({ field }) => (
            <FormItem className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex items-start gap-3 sm:items-center">
                <FormControl>
                  <Checkbox
                    id="terms-agreement"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    className="mt-1 sm:mt-0"
                  />
                </FormControl>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <FormLabel htmlFor="terms-agreement" className="cursor-pointer text-base font-semibold leading-7 text-brand-900">
                      我已閱讀並同意服務條款
                    </FormLabel>
                    <TermsDialog onAgree={() => form.setValue("agreedToTerms", true, { shouldValidate: true })}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50 sm:w-auto"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        查看服務條款
                      </Button>
                    </TermsDialog>
                  </div>
                  <FormMessage className="pl-0" />
                </div>
              </div>
            </FormItem>
          )}
        />
      ) : null}
    </section>
  )
}
