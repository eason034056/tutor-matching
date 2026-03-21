"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import TermsDialog from '@/components/TermsDialog'
import { buildLocationSummary, isRoadNameValid } from '@/lib/address-utils'
import { budgetRangeOptions, gradeOptions, schedulePresetOptions, subjectOptions } from '@/lib/case-form-options'
import { cn } from '@/lib/utils'
import { sendWebhookNotification } from '@/webhook-config'

type SubmitStatus = 'idle' | 'success' | 'error'
type StepKey = 'matching' | 'student' | 'contact'
type LessonMode = 'in_person' | 'online'
type FieldName =
  | 'subject'
  | 'grade'
  | 'budgetRange'
  | 'onlineDetail'
  | 'city'
  | 'district'
  | 'roadName'
  | 'selectedTimeSlots'
  | 'studentGender'
  | 'department'
  | 'studentDescription'
  | 'parentName'
  | 'parentPhone'
  | 'parentEmail'
  | 'terms'

type ValidationError = {
  field: FieldName
  message: string
}

const steps: { key: StepKey; label: string; description: string }[] = [
  { key: 'matching', label: '步驟 1', description: '填寫課程需求' },
  { key: 'student', label: '步驟 2', description: '學生與老師條件' },
  { key: 'contact', label: '步驟 3', description: '留下聯絡方式與確認送出' },
]

const onlineOption = '線上'

const createInitialFormData = () => ({
  lessonMode: 'in_person' as LessonMode,
  subject: '',
  subjectOther: '',
  grade: '',
  city: '',
  district: '',
  roadName: '',
  landmark: '',
  onlineDetail: '',
  budgetRange: '',
  selectedTimeSlots: [] as string[],
  availableTimeNote: '',
  studentGender: '',
  department: '',
  studentDescription: '',
  teacherRequirements: '',
  message: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  lineId: '',
})

const trustNotes = ['送出後顧問會先整理需求重點', '中心會根據需求安排家教老師']

const formatAvailableTime = (selected: string[], note: string) => {
  const parts = []
  if (selected.length > 0) {
    parts.push(selected.join('、'))
  }
  if (note.trim()) {
    parts.push(note.trim())
  }
  return parts.join('；')
}

const StepBadge = ({ active, index, label }: { active: boolean; index: number; label: string }) => (
  <div
    className={cn(
      'flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 transition-all duration-300',
      active
        ? 'border-brand-300 bg-white shadow-[0_14px_36px_rgba(67,102,78,0.08)]'
        : 'border-brand-100 bg-[#f4efe3]/80 text-neutral-500'
    )}
  >
    <div
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
        active ? 'bg-brand-500 text-white' : 'bg-white text-brand-500'
      )}
    >
      {index + 1}
    </div>
    <div>
      <div className="text-xs font-semibold tracking-[0.22em] text-brand-500">{label}</div>
      <div className="text-sm font-medium text-brand-900">{steps[index].description}</div>
    </div>
  </div>
)

const ChipButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200',
      active
        ? 'border-brand-500 bg-brand-500 text-white shadow-[0_14px_30px_rgba(66,122,91,0.22)]'
        : 'border-brand-200 bg-white text-brand-800 hover:border-brand-300 hover:bg-brand-50'
    )}
  >
    {children}
  </button>
)

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[1.2rem] border border-brand-100 bg-white/85 px-4 py-3">
    <div className="text-xs font-semibold tracking-[0.18em] text-brand-500">{label}</div>
    <div className="mt-2 text-sm leading-6 text-neutral-700">{value}</div>
  </div>
)

export default function CaseUploadForm() {
  const [formData, setFormData] = useState(createInitialFormData)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [cityOptions, setCityOptions] = useState<string[]>([])
  const [districtOptions, setDistrictOptions] = useState<string[]>([])
  const [roadSuggestions, setRoadSuggestions] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({})
  const [fieldErrorStep, setFieldErrorStep] = useState<number | null>(null)
  const formTopRef = useRef<HTMLElement | null>(null)
  const pendingScrollRef = useRef(false)
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLDivElement | null>>>({})
  const previousStepRef = useRef(currentStep)

  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await fetch('/api/address?mode=cities')
        const result = await response.json()
        setCityOptions(result.cities || [])
      } catch (error) {
        console.error('載入縣市失敗:', error)
      }
    }

    loadCities()
  }, [])

  useEffect(() => {
    if (!pendingScrollRef.current) {
      return
    }

    pendingScrollRef.current = false
    window.requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [currentStep, submitStatus])

  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      // Ensure errors from another step never leak into the newly-entered step.
      setFieldErrors({})
      setFieldErrorStep(null)
      previousStepRef.current = currentStep
    }
  }, [currentStep])

  useEffect(() => {
    if (formData.lessonMode === 'online' || !formData.city) {
      setDistrictOptions([])
      return
    }

    const loadDistricts = async () => {
      try {
        const response = await fetch(`/api/address?mode=districts&city=${encodeURIComponent(formData.city)}`)
        const result = await response.json()
        setDistrictOptions(result.districts || [])
      } catch (error) {
        console.error('載入行政區失敗:', error)
      }
    }

    loadDistricts()
  }, [formData.city, formData.lessonMode])

  useEffect(() => {
    if (formData.lessonMode === 'online' || !formData.city || !formData.district) {
      setRoadSuggestions([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          mode: 'roads',
          city: formData.city,
          district: formData.district,
          q: formData.roadName,
        })
        const response = await fetch(`/api/address?${params.toString()}`, { signal: controller.signal })
        const result = await response.json()
        setRoadSuggestions(result.roads || [])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('載入路名建議失敗:', error)
        }
      }
    }, 180)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [formData.city, formData.district, formData.lessonMode, formData.roadName])

  const finalSubject = useMemo(() => {
    return formData.subject === '其他' ? formData.subjectOther.trim() : formData.subject.trim()
  }, [formData.subject, formData.subjectOther])

  const locationSummary = useMemo(
    () =>
      buildLocationSummary({
        city: formData.lessonMode === 'online' ? '' : formData.city,
        district: formData.lessonMode === 'online' ? '' : formData.district,
        roadName: formData.lessonMode === 'online' ? '' : formData.roadName,
        landmark: formData.landmark,
        lessonMode: formData.lessonMode,
        onlineDetail: formData.onlineDetail,
      }),
    [formData.city, formData.district, formData.landmark, formData.lessonMode, formData.onlineDetail, formData.roadName]
  )

  const availableTimeSummary = useMemo(
    () => formatAvailableTime(formData.selectedTimeSlots, formData.availableTimeNote),
    [formData.availableTimeNote, formData.selectedTimeSlots]
  )

  const hasFieldError = (field: FieldName) =>
    fieldErrorStep === currentStep && Boolean(fieldErrors[field])

  const getFieldLabelClassName = (field: FieldName, baseClassName = 'text-sm font-semibold') =>
    cn(baseClassName, hasFieldError(field) ? 'text-red-700' : 'text-brand-900')

  const getFieldInputClassName = (field: FieldName, baseClassName: string) =>
    cn(
      baseClassName,
      hasFieldError(field) &&
        'border-red-300 bg-red-50/80 text-red-900 placeholder:text-red-400 focus-visible:ring-red-200'
    )

  const getFieldGroupClassName = (field: FieldName, baseClassName = '') =>
    cn(baseClassName, hasFieldError(field) && 'rounded-[1.4rem] border border-red-200 bg-red-50/40 p-4')

  const renderFieldError = (field: FieldName) =>
    fieldErrors[field] ? <p className="mt-2 text-sm font-medium text-red-600">{fieldErrors[field]}</p> : null

  const clearFieldErrors = (...fields: FieldName[]) => {
    if (fields.length === 0) {
      setFieldErrors({})
      setFieldErrorStep(null)
      return
    }

    setFieldErrors((prev) => {
      const next = { ...prev }
      let hasChanged = false

      fields.forEach((field) => {
        if (next[field]) {
          delete next[field]
          hasChanged = true
        }
      })

      return hasChanged ? next : prev
    })
  }

  const scrollToField = (field: FieldName) => {
    const node = fieldRefs.current[field]
    if (!node) {
      return
    }

    window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const applyValidationErrors = (errors: ValidationError[], stepIndex: number) => {
    const nextErrors: Partial<Record<FieldName, string>> = {}

    errors.forEach(({ field, message }) => {
      if (!nextErrors[field]) {
        nextErrors[field] = message
      }
    })

    setFieldErrors(nextErrors)
    setFieldErrorStep(stepIndex)

    if (errors[0]) {
      toast.error(errors[0].message)
      scrollToField(errors[0].field)
    }
  }

  const setField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle')
    }

    switch (key) {
      case 'subject':
      case 'subjectOther':
        clearFieldErrors('subject')
        break
      case 'grade':
        clearFieldErrors('grade')
        break
      case 'budgetRange':
        clearFieldErrors('budgetRange')
        break
      case 'onlineDetail':
        clearFieldErrors('onlineDetail')
        break
      case 'city':
        clearFieldErrors('city')
        break
      case 'district':
        clearFieldErrors('district')
        break
      case 'roadName':
        clearFieldErrors('roadName')
        break
      case 'availableTimeNote':
        clearFieldErrors('selectedTimeSlots')
        break
      case 'studentGender':
        clearFieldErrors('studentGender')
        break
      case 'department':
        clearFieldErrors('department')
        break
      case 'studentDescription':
        clearFieldErrors('studentDescription')
        break
      case 'parentName':
        clearFieldErrors('parentName')
        break
      case 'parentPhone':
        clearFieldErrors('parentPhone')
        break
      case 'parentEmail':
        clearFieldErrors('parentEmail')
        break
      default:
        break
    }
  }

  const toggleTimeSlot = (slot: string) => {
    clearFieldErrors('selectedTimeSlots')
    setField(
      'selectedTimeSlots',
      formData.selectedTimeSlots.includes(slot)
        ? formData.selectedTimeSlots.filter((item) => item !== slot)
        : [...formData.selectedTimeSlots, slot]
    )
  }

  const queueScrollToTop = () => {
    pendingScrollRef.current = true
  }

  const setFormContainerRef = (node: HTMLFormElement | null) => {
    formTopRef.current = node
  }

  const setPanelRef = (node: HTMLDivElement | null) => {
    formTopRef.current = node
  }

  const setFieldRef = (field: FieldName) => (node: HTMLDivElement | null) => {
    fieldRefs.current[field] = node
  }

  const validateStep = (stepIndex: number) => {
    const errors: ValidationError[] = []
    const pushError = (field: FieldName, message: string) => {
      errors.push({ field, message })
    }

    if (stepIndex === 0) {
      if (!finalSubject) pushError('subject', '請先選擇需求科目')
      if (!formData.grade) pushError('grade', '請先選擇年級')
      if (!formData.budgetRange) pushError('budgetRange', '請先選擇預算區間')
      if (!availableTimeSummary) pushError('selectedTimeSlots', '請至少選一個可上課時段或補充說明')

      if (formData.lessonMode === 'online') {
        if (!formData.onlineDetail.trim()) pushError('onlineDetail', '請填寫線上上課方式或平台')
      } else {
        if (!formData.city) pushError('city', '請先選擇縣市')
        if (!formData.district) pushError('district', '請先選擇行政區')
        if (!formData.roadName.trim()) {
          pushError('roadName', '請填寫路名或路段')
        } else if (!isRoadNameValid(formData.roadName)) {
          pushError('roadName', '請至少填到路名層級，例如光復路二段')
        }
      }
    }

    if (stepIndex === 1) {
      if (!formData.studentGender) pushError('studentGender', '請選擇學生性別')
      if (!formData.department.trim()) pushError('department', '請填寫就讀學校')
      if (!formData.studentDescription.trim()) pushError('studentDescription', '請描述學生目前狀況')
    }

    if (stepIndex === 2) {
      if (!formData.parentName.trim()) pushError('parentName', '請填寫家長姓名')
      if (!formData.parentPhone.trim()) pushError('parentPhone', '請填寫聯絡電話')
      const phoneDigits = formData.parentPhone.replace(/\D/g, '')
      if (formData.parentPhone.trim() && phoneDigits.length < 9) {
        pushError('parentPhone', '請填寫可聯繫的電話號碼')
      }
      if (formData.parentEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.parentEmail.trim())) {
          pushError('parentEmail', '電子信箱格式不正確')
        }
      }
      if (!hasAgreedToTerms) pushError('terms', '送出前請先同意服務條款')
    }

    return errors
  }

  const goNext = () => {
    const errors = validateStep(currentStep)
    if (errors.length > 0) {
      applyValidationErrors(errors, currentStep)
      return
    }
    clearFieldErrors()
    queueScrollToTop()
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1))
  }

  const goPrev = () => {
    clearFieldErrors()
    queueScrollToTop()
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const resetForm = () => {
    setFormData(createInitialFormData())
    setCurrentStep(0)
    setHasAgreedToTerms(false)
    setRoadSuggestions([])
    setFieldErrors({})
    setFieldErrorStep(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (currentStep < steps.length - 1) {
      goNext()
      return
    }

    const errors = validateStep(2)
    if (errors.length > 0) {
      applyValidationErrors(errors, 2)
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    clearFieldErrors()

    try {
      const caseNumber = `C${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      const caseData = {
        caseNumber,
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        parentEmail: formData.parentEmail.trim(),
        lineId: formData.lineId.trim(),
        studentGender: formData.studentGender,
        department: formData.department.trim(),
        grade: formData.grade,
        studentDescription: formData.studentDescription.trim(),
        subject: finalSubject,
        location: locationSummary,
        city: formData.lessonMode === 'online' ? '' : formData.city,
        district: formData.lessonMode === 'online' ? '' : formData.district,
        roadName: formData.lessonMode === 'online' ? '' : formData.roadName.trim(),
        landmark: formData.landmark.trim(),
        onlineDetail: formData.lessonMode === 'online' ? formData.onlineDetail.trim() : '',
        lessonMode: formData.lessonMode,
        region: formData.lessonMode === 'online' ? onlineOption : formData.city,
        availableTime: availableTimeSummary,
        teacherRequirements: formData.teacherRequirements.trim(),
        budgetRange: formData.budgetRange,
        message: formData.message.trim(),
        status: '急徵',
        pending: 'pending',
        documentStatus: 'not_requested',
        createdAt: new Date().toISOString(),
      }

      const response = await fetch('/api/cases/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || result.details || '提交失敗，請稍後再試')
      }

      queueScrollToTop()
      setSubmitStatus('success')
      setSubmitMessage('已收到需求，我們將盡快安排家教老師與您聯繫。')
      await sendWebhookNotification('new_case', caseData)
      resetForm()
    } catch (error) {
      console.error('送出需求失敗:', error)
      queueScrollToTop()
      setSubmitStatus('error')
      setSubmitMessage(error instanceof Error ? error.message : '提交失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div ref={setPanelRef} className="scroll-mt-28 rounded-[2rem] border border-brand-100 bg-white/95 p-6 shadow-[0_24px_80px_rgba(67,102,78,0.08)] md:scroll-mt-32 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <p className="mt-6 text-sm font-semibold tracking-[0.3em] text-brand-500">CASE RECEIVED</p>
          <h2 className="mt-3 font-display text-3xl text-brand-900 md:text-4xl">已收到需求</h2>
          <p className="mt-4 text-base leading-8 text-neutral-600">{submitMessage || '顧問將盡快與您聯繫，先和您確認學習狀況、排課與預算，再安排後續媒合。'}</p>

          <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
            <SummaryItem label="接下來" value="我們將盡快安排家教老師與您聯繫試教" />
            <SummaryItem label="LINE 協助" value="有任何問題都可以直接用LINE跟我們聯繫" />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://line.me/ti/p/~home-tutor-tw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button size="lg" className="min-h-12 rounded-full bg-brand-500 px-6 text-base text-white hover:bg-brand-600">
                <MessageCircle className="h-4 w-4" />
                前往 LINE 聯繫我們
              </Button>
            </a>
            <Link href="/" className="inline-flex">
              <Button type="button" variant="outline" size="lg" className="min-h-12 rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50">
                回首頁
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (submitStatus === 'error') {
    return (
      <div ref={setPanelRef} className="scroll-mt-28 rounded-[2rem] border border-red-200 bg-white/95 p-6 shadow-[0_24px_80px_rgba(120,54,54,0.08)] md:scroll-mt-32 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
            <XCircle className="h-10 w-10" />
          </div>
          <h2 className="mt-6 font-display text-3xl text-brand-900 md:text-4xl">送出時發生問題</h2>
          <p className="mt-4 text-base leading-8 text-neutral-600">{submitMessage || '資料暫時沒有送出成功，請再次確認資料或稍後重試。'}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" size="lg" className="min-h-12 rounded-full bg-brand-500 px-6 text-base text-white hover:bg-brand-600" onClick={() => setSubmitStatus('idle')}>
              回到表單
            </Button>
            <a
              href="https://line.me/ti/p/~home-tutor-tw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button type="button" variant="outline" size="lg" className="min-h-12 rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50">
                <MessageCircle className="h-4 w-4" />
                改用 LINE 諮詢
              </Button>
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form ref={setFormContainerRef} onSubmit={handleSubmit} className="space-y-6 scroll-mt-28 md:scroll-mt-32">
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <StepBadge key={step.key} active={index === currentStep} index={index} label={step.label} />
        ))}
      </div>

      {currentStep === 0 && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_20rem] lg:items-start">
          <div className="rounded-[2rem] border border-brand-100 bg-white/95 p-5 shadow-[0_24px_70px_rgba(67,102,78,0.08)] md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.24em] text-brand-500">MATCHING BRIEF</p>
                <h2 className="mt-2 font-display text-2xl text-brand-900 md:text-3xl">填寫課程需求</h2>
                <p className="mt-2 text-sm leading-7 text-neutral-600">請填寫上課方式、科目、年級、預算區間、可上課時段，謝謝您！</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-brand-900">上課方式</Label>
                <div className="mt-3 flex flex-wrap gap-3">
                  <ChipButton active={formData.lessonMode === 'in_person'} onClick={() => {
                    clearFieldErrors('onlineDetail')
                    setField('lessonMode', 'in_person')
                  }}>
                    實體上課
                  </ChipButton>
                  <ChipButton active={formData.lessonMode === 'online'} onClick={() => {
                    clearFieldErrors('city', 'district', 'roadName')
                    setField('lessonMode', 'online')
                    setField('city', '')
                    setField('district', '')
                    setField('roadName', '')
                  }}>
                    線上上課
                  </ChipButton>
                </div>
              </div>

              <div ref={setFieldRef('subject')} className={getFieldGroupClassName('subject')}>
                <Label className={getFieldLabelClassName('subject')}>需求科目</Label>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {subjectOptions.map((subject) => (
                    <ChipButton key={subject} active={formData.subject === subject} onClick={() => setField('subject', subject)}>
                      {subject}
                    </ChipButton>
                  ))}
                  <ChipButton active={formData.subject === '其他'} onClick={() => setField('subject', '其他')}>
                    其他
                  </ChipButton>
                </div>
                {formData.subject === '其他' && (
                  <Input
                    aria-invalid={hasFieldError('subject')}
                    className={getFieldInputClassName('subject', 'mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4')}
                    value={formData.subjectOther}
                    onChange={(event) => setField('subjectOther', event.target.value)}
                    placeholder="請輸入需求科目"
                  />
                )}
                {renderFieldError('subject')}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div ref={setFieldRef('grade')}>
                  <Label className={getFieldLabelClassName('grade')}>年級</Label>
                  <Select value={formData.grade} onValueChange={(value) => setField('grade', value)}>
                    <SelectTrigger
                      aria-invalid={hasFieldError('grade')}
                      className={getFieldInputClassName('grade', 'mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4 text-base')}
                    >
                      <SelectValue placeholder="請選擇年級" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {renderFieldError('grade')}
                </div>
                <div ref={setFieldRef('budgetRange')}>
                  <Label className={getFieldLabelClassName('budgetRange')}>預算區間</Label>
                  <Select value={formData.budgetRange} onValueChange={(value) => setField('budgetRange', value)}>
                    <SelectTrigger
                      aria-invalid={hasFieldError('budgetRange')}
                      className={getFieldInputClassName('budgetRange', 'mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4 text-base')}
                    >
                      <SelectValue placeholder="請選擇預算區間" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetRangeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {renderFieldError('budgetRange')}
                </div>
              </div>

              {formData.lessonMode === 'online' ? (
                <div ref={setFieldRef('onlineDetail')}>
                  <Label htmlFor="onlineDetail" className={getFieldLabelClassName('onlineDetail')}>線上上課平台或方式</Label>
                  <Input
                    id="onlineDetail"
                    aria-invalid={hasFieldError('onlineDetail')}
                    className={getFieldInputClassName('onlineDetail', 'mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4')}
                    value={formData.onlineDetail}
                    onChange={(event) => setField('onlineDetail', event.target.value)}
                    placeholder="例如：Google Meet、Zoom、視訊授課"
                  />
                  {renderFieldError('onlineDetail')}
                </div>
              ) : (
                <div className="rounded-[1.6rem] border border-brand-100 bg-[#f8f5ea] p-4 md:p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <MapPin className="mt-1 h-4 w-4 text-brand-600" />
                    <div>
                      <h3 className="text-base font-semibold text-brand-900">上課地址</h3>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">不用填門牌，但請填到路名，例如「新竹市東區光復路二段」。</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div ref={setFieldRef('city')}>
                      <Label className={getFieldLabelClassName('city')}>縣市</Label>
                      <Select
                        value={formData.city}
                        onValueChange={(value) => {
                          clearFieldErrors('city', 'district', 'roadName')
                          setField('city', value)
                          setField('district', '')
                          setField('roadName', '')
                        }}
                      >
                        <SelectTrigger
                          aria-invalid={hasFieldError('city')}
                          className={getFieldInputClassName('city', 'mt-3 h-12 rounded-2xl border-brand-200 bg-white px-4 text-base')}
                        >
                          <SelectValue placeholder="請選擇縣市" />
                        </SelectTrigger>
                        <SelectContent>
                          {cityOptions.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {renderFieldError('city')}
                    </div>
                    <div ref={setFieldRef('district')}>
                      <Label className={getFieldLabelClassName('district')}>行政區</Label>
                      <Select value={formData.district} onValueChange={(value) => setField('district', value)} disabled={!formData.city}>
                        <SelectTrigger
                          aria-invalid={hasFieldError('district')}
                          className={getFieldInputClassName('district', 'mt-3 h-12 rounded-2xl border-brand-200 bg-white px-4 text-base')}
                        >
                          <SelectValue placeholder={formData.city ? '請選擇行政區' : '先選縣市'} />
                        </SelectTrigger>
                        <SelectContent>
                          {districtOptions.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {renderFieldError('district')}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_0.9fr]">
                    <div ref={setFieldRef('roadName')}>
                      <Label htmlFor="roadName" className={getFieldLabelClassName('roadName')}>路名 / 路段</Label>
                      <Input
                        id="roadName"
                        list="road-suggestions"
                        aria-invalid={hasFieldError('roadName')}
                        className={getFieldInputClassName('roadName', 'mt-3 h-12 rounded-2xl border-brand-200 bg-white px-4')}
                        value={formData.roadName}
                        onChange={(event) => setField('roadName', event.target.value)}
                        placeholder="例如：光復路二段"
                      />
                      <datalist id="road-suggestions">
                        {roadSuggestions.map((road) => (
                          <option key={road} value={road} />
                        ))}
                      </datalist>
                      {renderFieldError('roadName')}
                    </div>
                    <div>
                      <Label htmlFor="landmark" className="text-sm font-semibold text-brand-900">補充地標（選填）</Label>
                      <Input
                        id="landmark"
                        className="mt-3 h-12 rounded-2xl border-brand-200 bg-white px-4"
                        value={formData.landmark}
                        onChange={(event) => setField('landmark', event.target.value)}
                        placeholder="例如：近清大正門"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={setFieldRef('selectedTimeSlots')} className={getFieldGroupClassName('selectedTimeSlots')}>
                <Label className={getFieldLabelClassName('selectedTimeSlots')}>可上課時段(可複選)</Label>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {schedulePresetOptions.map((slot) => (
                    <ChipButton key={slot} active={formData.selectedTimeSlots.includes(slot)} onClick={() => toggleTimeSlot(slot)}>
                      {slot}
                    </ChipButton>
                  ))}
                </div>
                <Textarea
                  aria-invalid={hasFieldError('selectedTimeSlots')}
                  className={getFieldInputClassName('selectedTimeSlots', 'mt-3 min-h-[110px] rounded-[1.4rem] border-brand-200 bg-[#fffdf8] px-4 py-3')}
                  value={formData.availableTimeNote}
                  onChange={(event) => setField('availableTimeNote', event.target.value)}
                  placeholder="也可以補充更細的時間，例如：週三 19:00 後、週日 14:00-17:00"
                />
                {renderFieldError('selectedTimeSlots')}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.8rem] border border-brand-100 bg-white/90 p-5 shadow-[0_18px_50px_rgba(67,102,78,0.06)]">
              <div className="flex items-center gap-3 text-sm font-semibold text-brand-700">
                <ShieldCheck className="h-4 w-4" />
                送出前你會先看到摘要
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
                {trustNotes.map((note) => (
                  <div key={note} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-brand-600" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.8rem] bg-brand-900 p-5 text-white shadow-[0_24px_70px_rgba(31,58,45,0.22)]">
              <p className="text-sm font-semibold tracking-[0.22em] text-brand-200">CURRENT BRIEF</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-brand-50">
                <div>科目：{finalSubject || '尚未選擇'}</div>
                <div>地點：{locationSummary || '尚未填寫'}</div>
                <div>預算：{formData.budgetRange || '尚未選擇'}</div>
                <div>時段：{availableTimeSummary || '尚未填寫'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="rounded-[2rem] border border-brand-100 bg-white/95 p-5 shadow-[0_24px_70px_rgba(67,102,78,0.08)] md:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-brand-500">STUDENT CONTEXT</p>
              <h2 className="mt-2 font-display text-2xl text-brand-900 md:text-3xl">孩子目前的學習狀況</h2>
              <p className="mt-2 text-sm leading-7 text-neutral-600">我們可以更了解孩子的學習情況、教學需求，以及您對老師的期待，幫助我們為孩子媒合最合適的老師。</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div ref={setFieldRef('studentGender')}>
              <Label className={getFieldLabelClassName('studentGender')}>學生性別</Label>
              <Select value={formData.studentGender} onValueChange={(value) => setField('studentGender', value)}>
                <SelectTrigger
                  aria-invalid={hasFieldError('studentGender')}
                  className={getFieldInputClassName('studentGender', 'mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4 text-base')}
                >
                  <SelectValue placeholder="請選擇學生性別" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男</SelectItem>
                  <SelectItem value="female">女</SelectItem>
                </SelectContent>
              </Select>
              {renderFieldError('studentGender')}
            </div>

            <div ref={setFieldRef('department')}>
              <Label htmlFor="department" className={getFieldLabelClassName('department')}>就讀學校</Label>
              <Input
                id="department"
                aria-invalid={hasFieldError('department')}
                className={getFieldInputClassName('department', 'mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4')}
                value={formData.department}
                onChange={(event) => setField('department', event.target.value)}
                placeholder="例如：建功高中、竹北國中"
              />
              {renderFieldError('department')}
            </div>
          </div>

          <div ref={setFieldRef('studentDescription')} className="mt-4">
            <Label htmlFor="studentDescription" className={getFieldLabelClassName('studentDescription')}>學生狀況描述</Label>
            <Textarea
              id="studentDescription"
              aria-invalid={hasFieldError('studentDescription')}
              className={getFieldInputClassName('studentDescription', 'mt-3 min-h-[150px] rounded-[1.4rem] border-brand-200 bg-[#fffdf8] px-4 py-3')}
              value={formData.studentDescription}
              onChange={(event) => setField('studentDescription', event.target.value)}
              placeholder="例如：目前高二，數學遇到三角函數與指對數卡關，希望先穩住校內成績，再往學測方向準備。"
            />
            {renderFieldError('studentDescription')}
          </div>

          <div className="mt-4">
            <Label htmlFor="teacherRequirements" className="text-sm font-semibold text-brand-900">希望的老師條件</Label>
            <Textarea
              id="teacherRequirements"
              className="mt-3 min-h-[120px] rounded-[1.4rem] border-brand-200 bg-[#fffdf8] px-4 py-3"
              value={formData.teacherRequirements}
              onChange={(event) => setField('teacherRequirements', event.target.value)}
              placeholder="例如：希望有高中家教經驗、擅長帶基礎補強，溝通溫和但節奏明確。"
            />
          </div>

          <div className="mt-4">
            <Label htmlFor="message" className="text-sm font-semibold text-brand-900">補充說明（選填）</Label>
            <Textarea
              id="message"
              className="mt-3 min-h-[120px] rounded-[1.4rem] border-brand-200 bg-[#fffdf8] px-4 py-3"
              value={formData.message}
              onChange={(event) => setField('message', event.target.value)}
              placeholder="還有任何補充需求，都可以先寫在這裡。"
            />
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_20rem] lg:items-start">
          <div className="rounded-[2rem] border border-brand-100 bg-white/95 p-5 shadow-[0_24px_70px_rgba(67,102,78,0.08)] md:p-6">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.24em] text-brand-500">CONTACT</p>
                <h2 className="mt-2 font-display text-2xl text-brand-900 md:text-3xl">留下聯絡方式與最後確認</h2>
                <p className="mt-2 text-sm leading-7 text-neutral-600">電話必填，LINE 與 Email 可選填。證件與身分字號會在顧問確認需求後，提供專屬補件連結。</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div ref={setFieldRef('parentName')}>
                <Label htmlFor="parentName" className={getFieldLabelClassName('parentName')}>家長姓名</Label>
                <Input
                  id="parentName"
                  aria-invalid={hasFieldError('parentName')}
                  className={getFieldInputClassName('parentName', 'mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4')}
                  value={formData.parentName}
                  onChange={(event) => setField('parentName', event.target.value)}
                  placeholder="請填寫家長姓名"
                />
                {renderFieldError('parentName')}
              </div>
              <div ref={setFieldRef('parentPhone')}>
                <Label htmlFor="parentPhone" className={getFieldLabelClassName('parentPhone')}>聯絡電話</Label>
                <Input
                  id="parentPhone"
                  aria-invalid={hasFieldError('parentPhone')}
                  className={getFieldInputClassName('parentPhone', 'mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4')}
                  value={formData.parentPhone}
                  onChange={(event) => setField('parentPhone', event.target.value)}
                  placeholder="例如：0912345678 或 02-12345678"
                />
                {renderFieldError('parentPhone')}
              </div>
              <div>
                <Label htmlFor="lineId" className="text-sm font-semibold text-brand-900">LINE ID（選填）</Label>
                <Input
                  id="lineId"
                  className="mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4"
                  value={formData.lineId}
                  onChange={(event) => setField('lineId', event.target.value)}
                  placeholder="若希望顧問用 LINE 聯繫，可先留下"
                />
              </div>
              <div ref={setFieldRef('parentEmail')}>
                <Label htmlFor="parentEmail" className={getFieldLabelClassName('parentEmail')}>電子信箱（選填）</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  aria-invalid={hasFieldError('parentEmail')}
                  className={getFieldInputClassName('parentEmail', 'mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4')}
                  value={formData.parentEmail}
                  onChange={(event) => setField('parentEmail', event.target.value)}
                  placeholder="your.name@email.com"
                />
                {renderFieldError('parentEmail')}
              </div>
            </div>

            <div
              ref={setFieldRef('terms')}
              className={cn(
                'mt-6 rounded-[1.6rem] border border-brand-100 bg-[#f8f5ea] p-4',
                hasFieldError('terms') && 'border-red-200 bg-red-50/50'
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-agreement"
                  aria-invalid={hasFieldError('terms')}
                  className={cn(hasFieldError('terms') && 'border-red-300 data-[state=checked]:border-red-500')}
                  checked={hasAgreedToTerms}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      clearFieldErrors('terms')
                    }
                    setHasAgreedToTerms(Boolean(checked))
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor="terms-agreement" className={cn('cursor-pointer text-sm font-medium', hasFieldError('terms') ? 'text-red-700' : 'text-brand-900')}>
                    我已閱讀並同意服務條款
                  </Label>
                  <p className="mt-2 text-xs leading-6 text-neutral-600">證件照片與身分證字號不會在此頁收集，補件連結會在顧問確認需求後提供。</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <TermsDialog onAgree={() => setHasAgreedToTerms(true)}>
                      <Button type="button" variant="outline" size="sm" className="rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50">
                        查看服務條款
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TermsDialog>
                    <Link href="https://line.me/ti/p/~home-tutor-tw" target="_blank" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50">
                      <MessageCircle className="h-4 w-4" />
                      先用 LINE 詢問顧問
                    </Link>
                  </div>
                  {renderFieldError('terms')}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.8rem] border border-brand-100 bg-white/90 p-5 shadow-[0_18px_50px_rgba(67,102,78,0.06)]">
              <div className="flex items-center gap-3 text-sm font-semibold text-brand-700">
                <Clock3 className="h-4 w-4" />
                送出前摘要
              </div>
              <div className="mt-4 grid gap-3">
                <SummaryItem label="科目" value={finalSubject || '尚未填寫'} />
                <SummaryItem label="地址 / 上課方式" value={locationSummary || '尚未填寫'} />
                <SummaryItem label="預算" value={formData.budgetRange || '尚未選擇'} />
                <SummaryItem label="時段" value={availableTimeSummary || '尚未填寫'} />
                <SummaryItem label="學生狀況" value={formData.studentDescription || '尚未填寫'} />
              </div>
            </div>

            <div className="rounded-[1.8rem] bg-brand-900 p-5 text-white shadow-[0_24px_70px_rgba(31,58,45,0.22)]">
              <p className="text-sm font-semibold tracking-[0.22em] text-brand-100">FOLLOW-UP</p>
              <p className="mt-4 text-sm leading-7 text-brand-50">補件連結會在需求確認後提供，家長只需要透過專屬連結補上身分證字號與證件照片即可。</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-brand-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" className="justify-start rounded-full px-0 text-brand-700 hover:bg-transparent hover:text-brand-900" onClick={goPrev} disabled={currentStep === 0 || isSubmitting}>
          <ArrowLeft className="h-4 w-4" />
          上一步
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button type="button" size="lg" className="min-h-12 rounded-full bg-brand-500 px-6 text-base text-white hover:bg-brand-600" onClick={goNext}>
            下一步
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" size="lg" className="min-h-12 rounded-full bg-brand-500 px-6 text-base text-white hover:bg-brand-600" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                送出中...
              </span>
            ) : (
              '送出需求'
            )}
          </Button>
        )}
      </div>
    </form>
  )
}
