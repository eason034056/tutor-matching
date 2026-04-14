"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, RefreshCcw, UserCheck } from "lucide-react"

import BasicInfoStep from "@/components/tutor-registration/basic-info-step"
import DocumentsStep from "@/components/tutor-registration/documents-step"
import TeachingProfileStep from "@/components/tutor-registration/teaching-profile-step"
import { useTutorDocumentUpload } from "@/components/tutor-registration/use-tutor-document-upload"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  type TutorDocumentUploadSlot,
  type TutorDocumentUploadSlots,
} from "@/lib/tutor-document-upload"
import {
  createTutorFormDefaults,
  createTutorFormSchema,
  normalizeTutorSubjects,
  type TutorFormSeed,
  type TutorFormValues,
} from "@/lib/tutor-form"

type TutorRegistrationFormProps = {
  mode?: "registration" | "resubmission"
  resubmissionToken?: string
  phoneTail?: string
  initialValues?: TutorFormSeed & { tutorCode?: string }
  existingDocuments?: {
    studentIdCardUrl?: string
    idCardUrl?: string
  }
}

type StepConfig = {
  key: "basic" | "teaching" | "documents"
  title: string
  subtitle: string
  fields: Array<keyof TutorFormValues>
}

const stepConfigs: StepConfig[] = [
  {
    key: "basic",
    title: "基本資料",
    subtitle: "姓名、Email、電話",
    fields: ["name", "email", "phoneNumber"],
  },
  {
    key: "teaching",
    title: "教學背景",
    subtitle: "科目、經驗、學校與專長",
    fields: ["subjects", "experience", "school", "major", "expertise"],
  },
  {
    key: "documents",
    title: "證件與送出",
    subtitle: "上傳學生證、身分證並送審",
    fields: ["agreedToTerms"],
  },
]

const uploadStateLabel: Record<TutorDocumentUploadSlot["state"], string> = {
  idle: "未上傳",
  processing: "處理中",
  uploading: "上傳中",
  uploaded: "完成",
  failed: "失敗",
}

const readJsonResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    const text = await response.text()
    throw new Error(text || "伺服器回應格式錯誤")
  }

  return response.json()
}

const buildStepClassName = (index: number, currentStep: number) => {
  if (index < currentStep) {
    return "border-brand-500 bg-brand-500 text-white shadow-[0_12px_30px_rgba(66,122,91,0.2)]"
  }

  if (index === currentStep) {
    return "border-brand-300 bg-white text-brand-800 shadow-[0_10px_24px_rgba(66,122,91,0.08)]"
  }

  return "border-brand-100 bg-[#f4efe3]/80 text-neutral-500"
}

const getSummaryValue = (value: string) => {
  const normalized = value.trim()
  return normalized || "尚未填寫"
}

const getUploadSummary = (slots: TutorDocumentUploadSlots) => {
  const student = uploadStateLabel[slots.studentIdCard.state]
  const idCard = uploadStateLabel[slots.idCard.state]
  return `學生證 ${student} / 身分證 ${idCard}`
}

export default function TutorRegistrationForm({
  mode = "registration",
  resubmissionToken,
  phoneTail,
  initialValues,
  existingDocuments,
}: TutorRegistrationFormProps) {
  const isResubmission = mode === "resubmission"
  const router = useRouter()
  const stepTopRef = useRef<HTMLDivElement | null>(null)

  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [submitMessage, setSubmitMessage] = useState("")
  const [tutorCode, setTutorCode] = useState(initialValues?.tutorCode || "")

  const schema = useMemo(
    () =>
      createTutorFormSchema({
        requireStudentIdCard: false,
        requireIdCard: false,
        requireTerms: !isResubmission,
      }),
    [isResubmission]
  )

  const form = useForm<TutorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: createTutorFormDefaults(initialValues, !isResubmission),
  })

  const {
    slots,
    isAnyUploading,
    selectFile,
    retryUpload,
    resetUploads,
    getSubmissionDocumentUrls,
  } = useTutorDocumentUpload(existingDocuments)

  useEffect(() => {
    form.reset(createTutorFormDefaults(initialValues, !isResubmission))
    setTutorCode(initialValues?.tutorCode || "")
    setCurrentStep(0)
  }, [form, initialValues, isResubmission])

  const submitRegistration = async (
    values: TutorFormValues,
    documentUrls: { studentIdCardUrl: string; idCardUrl: string }
  ) => {
    const generatedTutorCode = tutorCode || Math.random().toString(36).slice(2, 8).toUpperCase()
    const submitData = {
      name: values.name.trim(),
      email: values.email.trim(),
      phoneNumber: values.phoneNumber.trim(),
      subjects: normalizeTutorSubjects(values.subjects),
      experience: values.experience.trim(),
      school: values.school.trim(),
      major: values.major.trim(),
      expertise: values.expertise.trim(),
      receiveNewCaseNotifications: values.receiveNewCaseNotifications,
      studentIdCardUrl: documentUrls.studentIdCardUrl,
      idCardUrl: documentUrls.idCardUrl,
      tutorCode: generatedTutorCode,
      isActive: false,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    const response = await fetch("/api/tutors/pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
    })
    const data = await readJsonResponse(response)

    if (!response.ok) {
      throw new Error(data.error || data.details || "提交失敗")
    }

    setTutorCode(generatedTutorCode)
    setSubmitMessage(`您的教師編號是 ${generatedTutorCode}，請妥善保存。我們會在 1-2 個工作天內完成審核。`)
  }

  const submitResubmission = async (
    values: TutorFormValues,
    documentUrls: { studentIdCardUrl: string; idCardUrl: string }
  ) => {
    if (!resubmissionToken || !phoneTail) {
      throw new Error("缺少補件驗證資訊")
    }

    const submitData = {
      phoneTail,
      name: values.name.trim(),
      email: values.email.trim(),
      phoneNumber: values.phoneNumber.trim(),
      subjects: normalizeTutorSubjects(values.subjects),
      experience: values.experience.trim(),
      school: values.school.trim(),
      major: values.major.trim(),
      expertise: values.expertise.trim(),
      receiveNewCaseNotifications: values.receiveNewCaseNotifications,
      studentIdCardUrl: documentUrls.studentIdCardUrl,
      idCardUrl: documentUrls.idCardUrl,
    }

    const response = await fetch(`/api/tutor-resubmission/${resubmissionToken}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
    })
    const data = await readJsonResponse(response)

    if (!response.ok) {
      throw new Error(data.error || "重新送審失敗")
    }

    setSubmitMessage("已收到你更新後的申請資料，我們會重新安排審核。")
  }

  const onSubmit = async (values: TutorFormValues) => {
    try {
      if (isAnyUploading) {
        throw new Error("證件上傳仍在進行中，請等待完成後再送出。")
      }

      const documentUrls = getSubmissionDocumentUrls()
      if (!documentUrls) {
        throw new Error("請完成學生證與身分證上傳後再送出。")
      }

      setIsSubmitting(true)
      setSubmitStatus("idle")

      if (isResubmission) {
        await submitResubmission(values, documentUrls)
      } else {
        await submitRegistration(values, documentUrls)
      }

      setSubmitStatus("success")
    } catch (error) {
      setSubmitStatus("error")
      setSubmitMessage(error instanceof Error ? error.message : "提交失敗，請稍後再試")
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToStepTop = () => {
    if (!stepTopRef.current) return
    stepTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const goPrev = () => {
    if (currentStep === 0 || isSubmitting) return
    setCurrentStep((step) => Math.max(step - 1, 0))
    scrollToStepTop()
  }

  const goNext = async () => {
    if (currentStep >= stepConfigs.length - 1 || isSubmitting) return
    const fieldsToValidate = stepConfigs[currentStep].fields
    const isValid = await form.trigger(fieldsToValidate, { shouldFocus: true })
    if (!isValid) return

    setCurrentStep((step) => Math.min(step + 1, stepConfigs.length - 1))
    scrollToStepTop()
  }

  const resetRegistrationForm = () => {
    form.reset(createTutorFormDefaults(undefined, !isResubmission))
    resetUploads()
    setCurrentStep(0)
    setSubmitStatus("idle")
    setSubmitMessage("")
    if (!isResubmission) {
      setTutorCode("")
    }
  }

  const values = form.watch()
  const currentStepConfig = stepConfigs[currentStep]
  const isFinalStep = currentStep === stepConfigs.length - 1
  const hasCompletedDocumentUploads = Boolean(getSubmissionDocumentUrls())
  const canSubmit = !isSubmitting && !isAnyUploading && hasCompletedDocumentUploads

  if (submitStatus === "success") {
    return (
      <div className="rounded-[2rem] border border-brand-100 bg-white/95 p-6 text-center shadow-[0_24px_70px_rgba(67,102,78,0.08)] md:p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          {isResubmission ? <RefreshCcw className="h-10 w-10" /> : <UserCheck className="h-10 w-10" />}
        </div>
        <h2 className="mt-6 font-display text-3xl text-brand-900 md:text-4xl">
          {isResubmission ? "重新送審成功" : "註冊成功"}
        </h2>
        <p className="mt-4 text-base leading-8 text-neutral-600">{submitMessage}</p>

        {tutorCode ? (
          <div className="mx-auto mt-6 max-w-sm rounded-[1.4rem] border border-brand-100 bg-[#f8f5ea] px-4 py-5">
            <div className="text-sm font-semibold tracking-[0.22em] text-brand-500">教師編號</div>
            <div className="mt-3 text-3xl font-semibold tracking-[0.24em] text-brand-900">{tutorCode}</div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!isResubmission ? (
            <Button className="rounded-full bg-brand-500 text-white hover:bg-brand-600" onClick={resetRegistrationForm}>
              再登錄一位教師
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50"
            onClick={() => router.push("/")}
          >
            返回首頁
          </Button>
        </div>
      </div>
    )
  }

  if (submitStatus === "error") {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-white/95 p-6 text-center shadow-[0_24px_70px_rgba(120,53,15,0.08)] md:p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="mt-6 font-display text-3xl text-neutral-900 md:text-4xl">送出失敗</h2>
        <p className="mt-4 text-base leading-8 text-neutral-600">{submitMessage}</p>
        <Button className="mt-8 rounded-full bg-brand-500 text-white hover:bg-brand-600" onClick={() => setSubmitStatus("idle")}>
          返回表單
        </Button>
      </div>
    )
  }

  return (
    <div ref={stepTopRef} className="space-y-5">
      <div className="rounded-[1.9rem] border border-brand-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,250,242,0.92))] p-5 shadow-[0_24px_70px_rgba(67,102,78,0.08)] md:p-6">
        <p className="text-xs font-semibold tracking-[0.26em] text-brand-500">
          {isResubmission ? "TUTOR RESUBMISSION" : "TUTOR REGISTRATION"}
        </p>
        <h2 className="mt-3 font-display text-2xl text-brand-900 md:text-3xl">
          {isResubmission ? "更新資料後重新送審" : "三步完成教師登錄"}
        </h2>
        <p className="mt-2 text-sm leading-7 text-neutral-600">
          {isResubmission
            ? "你可以沿用原本證件，也可以替換其中任一張。每次選檔會立即上傳並回報狀態。"
            : ""}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {stepConfigs.map((step, index) => (
            <div key={step.key} className={`rounded-[1.2rem] px-3 py-3 text-center ${buildStepClassName(index, currentStep)}`}>
              <div className="text-xs font-semibold tracking-[0.16em]">步驟 {index + 1}</div>
              <div className="mt-1 text-sm font-semibold">{step.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {currentStep === 0 ? <BasicInfoStep form={form} /> : null}
            {currentStep === 1 ? <TeachingProfileStep form={form} /> : null}
            {currentStep === 2 ? (
              <DocumentsStep
                form={form}
                isResubmission={isResubmission}
                slots={slots}
                onSelectFile={selectFile}
                onRetryUpload={retryUpload}
              />
            ) : null}

            <div className="sticky bottom-0 z-20 rounded-[1.2rem] border border-brand-100 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(67,102,78,0.08)] backdrop-blur mobile-safe-bottom">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1 rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50"
                  onClick={goPrev}
                  disabled={currentStep === 0 || isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  上一步
                </Button>

                {!isFinalStep ? (
                  <Button
                    type="button"
                    className="min-h-11 flex-1 rounded-full bg-brand-500 text-white hover:bg-brand-600"
                    onClick={goNext}
                    disabled={isSubmitting}
                  >
                    下一步
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="min-h-11 flex-1 rounded-full bg-brand-500 text-white hover:bg-brand-600"
                    disabled={!canSubmit}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isResubmission ? "重新送審中..." : "送出中..."}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {isResubmission ? "送出更新資料" : "提交教師申請"}
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>

        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-[1.6rem] border border-brand-100 bg-white/95 p-4 shadow-[0_14px_36px_rgba(67,102,78,0.06)]">
            <div className="text-xs font-semibold tracking-[0.22em] text-brand-500">CURRENT STEP</div>
            <div className="mt-2 text-lg font-semibold text-brand-900">{currentStepConfig.title}</div>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{currentStepConfig.subtitle}</p>
          </div>

          <div className="rounded-[1.6rem] border border-brand-100 bg-white/95 p-4 shadow-[0_14px_36px_rgba(67,102,78,0.06)]">
            <div className="text-xs font-semibold tracking-[0.22em] text-brand-500">FORM SUMMARY</div>
            <div className="mt-3 space-y-2 text-sm leading-7 text-neutral-700">
              <div>姓名：{getSummaryValue(values.name)}</div>
              <div>Email：{getSummaryValue(values.email)}</div>
              <div>電話：{getSummaryValue(values.phoneNumber)}</div>
              <div>科目：{getSummaryValue(values.subjects)}</div>
              <div>教學經驗：{getSummaryValue(values.experience)}</div>
              <div>學校：{getSummaryValue(values.school)}</div>
              <div>科系：{getSummaryValue(values.major)}</div>
              <div>專長：{getSummaryValue(values.expertise)}</div>
              <div>證件上傳：{getUploadSummary(slots)}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
