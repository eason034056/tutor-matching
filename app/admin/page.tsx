'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import {
  Copy,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  Search,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

import LoginForm from '@/components/auth/LoginForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { buildCaseNotificationData, normalizeCase, type CaseDocumentStatus } from '@/lib/case-utils'
import { TUTOR_REVISION_REASON_OPTIONS, type TutorRevisionReasonCode } from '@/lib/tutor-review'
import { auth, db, storage } from '@/server/config/firebase'
import type { CaseNotificationData, Tutor, TutorCase } from '@/server/types'
import { sendNewCaseEmailNotification } from '@/webhook-config'

type PendingTutor = Tutor & { docId: string }
type PendingCase = TutorCase & { docId: string }

type SearchResults = {
  tutor: PendingTutor | null
  case: PendingCase | null
}

const documentStatusStyles: Record<CaseDocumentStatus, string> = {
  not_requested: 'bg-neutral-100 text-neutral-700',
  requested: 'bg-amber-100 text-amber-800',
  submitted: 'bg-emerald-100 text-emerald-800',
}

const statusStyles: Record<'急徵' | '有人接洽' | '已徵到', string> = {
  急徵: 'bg-red-500 text-white hover:bg-red-500',
  有人接洽: 'bg-amber-500 text-white hover:bg-amber-500',
  已徵到: 'bg-emerald-600 text-white hover:bg-emerald-600',
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[1.5rem] border border-brand-100 bg-white/90 px-4 py-4 shadow-[0_16px_40px_rgba(67,102,78,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-brand-900">{value}</div>
      <div className="mt-1 text-sm text-neutral-500">{hint}</div>
    </div>
  )
}

function DashboardSection({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-brand-100 bg-white/95 shadow-[0_26px_90px_rgba(67,102,78,0.08)]">
      <CardHeader className="border-b border-brand-100 bg-[#fffdf8] pb-5">
        <CardTitle className="font-display text-2xl text-brand-900">{title}</CardTitle>
        <p className="mt-2 text-sm leading-7 text-neutral-600">{subtitle}</p>
      </CardHeader>
      <CardContent className="p-5 md:p-6">{children}</CardContent>
    </Card>
  )
}

function DocumentStatusBadge({ status }: { status: CaseDocumentStatus }) {
  const normalized = normalizeCase({ documentStatus: status })
  return <Badge className={documentStatusStyles[status]}>{normalized.documentStatusLabel}</Badge>
}

function CopyableLinkButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={disabled} className="rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50">
      <Copy className="h-4 w-4" />
      {label}
    </Button>
  )
}

const parseJsonResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const fallbackText = await response.text()
    throw new Error(fallbackText || '伺服器回應格式錯誤')
  }

  return response.json()
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [pendingTutors, setPendingTutors] = useState<PendingTutor[]>([])
  const [pendingCases, setPendingCases] = useState<PendingCase[]>([])
  const [tutorCode, setTutorCode] = useState('')
  const [caseNumber, setCaseNumber] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults>({ tutor: null, case: null })
  const [searching, setSearching] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'急徵' | '已徵到' | '有人接洽' | ''>('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null)
  const [revisionDialogTutor, setRevisionDialogTutor] = useState<PendingTutor | null>(null)
  const [selectedRevisionReasons, setSelectedRevisionReasons] = useState<TutorRevisionReasonCode[]>([])
  const [revisionNote, setRevisionNote] = useState('')

  const followUpCount = useMemo(
    () => pendingCases.filter((caseItem) => normalizeCase(caseItem).documentStatus !== 'submitted').length,
    [pendingCases]
  )

  const fetchPendingData = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) return

      const tutorsQuery = query(collection(db, 'tutors'), where('status', '==', 'pending'))
      const casesQuery = query(collection(db, 'cases'), where('pending', '==', 'pending'))

      const [tutorsSnapshot, casesSnapshot] = await Promise.all([getDocs(tutorsQuery), getDocs(casesQuery)])

      setPendingTutors(
        tutorsSnapshot.docs.map((item) => ({
          ...(item.data() as Tutor),
          docId: item.id,
          id: (item.data() as Tutor).id || item.id,
        }))
      )

      setPendingCases(
        casesSnapshot.docs.map((item) => ({
          ...(item.data() as TutorCase),
          docId: item.id,
          id: (item.data() as TutorCase).id || item.id,
        }))
      )
    } catch (error) {
      console.error('載入待審核資料失敗:', error)
      toast.error('載入待審核資料失敗')
    }
  }

  const getApprovedTutorEmails = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'approvedTutors'))
      return snapshot.docs
        .map((item) => item.data())
        .filter((item) => Boolean(item.email) && item.receiveNewCaseNotifications === true)
        .map((item) => item.email as string)
    } catch (error) {
      console.error('獲取教師 email 失敗:', error)
      return []
    }
  }

  const sendNewCaseNotification = async (caseData: CaseNotificationData) => {
    try {
      const emailList = await getApprovedTutorEmails()
      const result = await sendNewCaseEmailNotification(caseData, emailList)
      if (result.success) {
        toast.success(`已通知 ${emailList.length} 位教師`) 
      }
    } catch (error) {
      console.error('發送新案件通知失敗:', error)
      toast.error('案件已通過，但郵件通知未成功發送')
    }
  }

  const handleSearch = async () => {
    if (!tutorCode && !caseNumber) {
      toast.info('請輸入教師編號或案件編號')
      return
    }

    setSearching(true)
    try {
      let tutorResult: PendingTutor | null = null
      let caseResult: PendingCase | null = null

      if (tutorCode) {
        const tutorSnapshot = await getDocs(query(collection(db, 'tutors'), where('tutorCode', '==', tutorCode)))
        if (!tutorSnapshot.empty) {
          const tutorDoc = tutorSnapshot.docs[0]
          tutorResult = {
            ...(tutorDoc.data() as Tutor),
            docId: tutorDoc.id,
            id: (tutorDoc.data() as Tutor).id || tutorDoc.id,
          }
        }
      }

      if (caseNumber) {
        const caseSnapshot = await getDocs(query(collection(db, 'cases'), where('caseNumber', '==', caseNumber)))
        if (!caseSnapshot.empty) {
          const caseDoc = caseSnapshot.docs[0]
          caseResult = {
            ...(caseDoc.data() as TutorCase),
            docId: caseDoc.id,
            id: (caseDoc.data() as TutorCase).id || caseDoc.id,
          }
        }
      }

      setSearchResults({ tutor: tutorResult, case: caseResult })
      if (!tutorResult && !caseResult) {
        toast.error('找不到符合的資料')
      }
    } catch (error) {
      console.error('搜尋失敗:', error)
      toast.error('搜尋失敗')
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => {
    setTutorCode('')
    setCaseNumber('')
    setSearchResults({ tutor: null, case: null })
    setSelectedStatus('')
  }

  const updateLocalCase = (docId: string, patch: Partial<PendingCase>) => {
    setPendingCases((prev) => prev.map((item) => (item.docId === docId ? { ...item, ...patch } : item)))
    setSearchResults((prev) => ({
      ...prev,
      case: prev.case?.docId === docId ? { ...prev.case, ...patch } : prev.case,
    }))
  }

  const handleGenerateDocumentLink = async (docId: string) => {
    setGeneratingLinkId(docId)
    try {
      const response = await fetch(`/api/cases/${docId}/document-link`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || '無法建立補件連結')
      }

      const fullLink = `${window.location.origin}${result.path}`
      await navigator.clipboard.writeText(fullLink)
      updateLocalCase(docId, {
        documentStatus: 'requested',
        documentRequestedAt: new Date().toISOString(),
        documentRequestExpiresAt: result.expiresAt,
      })
      toast.success('已建立並複製補件連結')
    } catch (error) {
      console.error('建立補件連結失敗:', error)
      toast.error(error instanceof Error ? error.message : '建立補件連結失敗')
    } finally {
      setGeneratingLinkId(null)
    }
  }

  const handleCaseStatusUpdate = async (caseDocId: string, newStatus: '急徵' | '已徵到' | '有人接洽') => {
    if (updatingStatus) return
    setUpdatingStatus(true)

    try {
      const originalCaseRef = doc(db, 'cases', caseDocId)
      const originalCaseSnapshot = await getDoc(originalCaseRef)
      if (originalCaseSnapshot.exists()) {
        await updateDoc(originalCaseRef, {
          status: newStatus,
          statusUpdatedAt: new Date().toISOString(),
        })
      }

      const searchedCase = searchResults.case
      if (searchedCase?.caseNumber) {
        const approvedCasesSnapshot = await getDocs(
          query(collection(db, 'approvedCases'), where('caseNumber', '==', searchedCase.caseNumber))
        )
        if (!approvedCasesSnapshot.empty) {
          await updateDoc(approvedCasesSnapshot.docs[0].ref, {
            status: newStatus,
            statusUpdatedAt: new Date().toISOString(),
          })
        }
      }

      updateLocalCase(caseDocId, { status: newStatus })
      toast.success(`案件狀態已更新為「${newStatus}」`)
      setSelectedStatus('')
    } catch (error) {
      console.error('更新案件狀態失敗:', error)
      toast.error('更新案件狀態失敗')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleTutorApprove = async (docId: string) => {
    if (processing) return
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/tutors/${docId}/approve`, {
        method: 'POST',
      })
      const result = await parseJsonResponse(response)
      if (!response.ok) {
        throw new Error(result.error || '審核教師失敗')
      }

      toast.success('教師已通過審核')
      await fetchPendingData()
    } catch (error) {
      console.error('審核教師失敗:', error)
      toast.error(error instanceof Error ? error.message : '審核教師失敗')
    } finally {
      setProcessing(false)
    }
  }

  const getStoragePath = (url: string) => {
    try {
      if (url.startsWith('gs://')) {
        return url.replace(/^gs:\/\/[^/]+\//, '')
      }
      const urlObj = new URL(url)
      const pathMatch = urlObj.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/)
      return pathMatch ? decodeURIComponent(pathMatch[1]) : null
    } catch (error) {
      console.error('解析檔案路徑失敗:', error)
      return null
    }
  }

  const deleteStorageAsset = async (url?: string) => {
    if (!url) return
    const storagePath = getStoragePath(url)
    if (!storagePath) return
    await deleteObject(ref(storage, storagePath))
  }

  const handleTutorReject = async (docId: string) => {
    const tutor = pendingTutors.find((item) => item.docId === docId) || null
    setRevisionDialogTutor(tutor)
    setSelectedRevisionReasons([])
    setRevisionNote('')
  }

  const handleTutorRevisionSubmit = async () => {
    if (!revisionDialogTutor || processing) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/tutors/${revisionDialogTutor.docId}/request-revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reasonCodes: selectedRevisionReasons,
          note: revisionNote,
        }),
      })
      const result = await parseJsonResponse(response)

      if (!response.ok) {
        throw new Error(result.error || '退回補件失敗')
      }

      toast.success('已寄出補件通知，教師可重新提交案件')
      setRevisionDialogTutor(null)
      setSelectedRevisionReasons([])
      setRevisionNote('')
      await fetchPendingData()
    } catch (error) {
      console.error('退回教師補件失敗:', error)
      toast.error(error instanceof Error ? error.message : '退回補件失敗')
    } finally {
      setProcessing(false)
    }
  }

  const toggleRevisionReason = (reasonCode: TutorRevisionReasonCode, checked: boolean) => {
    setSelectedRevisionReasons((prev) => {
      if (checked) {
        return [...prev, reasonCode]
      }

      return prev.filter((item) => item !== reasonCode)
    })
  }

  const closeRevisionDialog = () => {
    if (processing) return
    setRevisionDialogTutor(null)
    setSelectedRevisionReasons([])
    setRevisionNote('')
  }

  const handleCaseApprove = async (docId: string) => {
    if (processing) return
    setProcessing(true)
    try {
      const caseRef = doc(db, 'cases', docId)
      const caseSnapshot = await getDoc(caseRef)
      if (!caseSnapshot.exists()) throw new Error('找不到案件資料')

      const caseData = caseSnapshot.data() as TutorCase
      const normalized = normalizeCase(caseData)

      await updateDoc(caseRef, {
        pending: 'approved',
        approvedAt: new Date().toISOString(),
      })

      await addDoc(collection(db, 'approvedCases'), {
        caseId: docId,
        caseNumber: caseData.caseNumber,
        subject: caseData.subject,
        grade: caseData.grade,
        location: normalized.location,
        availableTime: caseData.availableTime,
        teacherRequirements: caseData.teacherRequirements || '',
        studentDescription: caseData.studentDescription,
        hourlyFee: caseData.hourlyFee,
        budgetRange: normalized.budgetRange,
        status: caseData.status,
        region: caseData.region,
        documentStatus: normalized.documentStatus,
        approvedAt: new Date().toISOString(),
      })

      toast.success('案件已通過審核')
      await sendNewCaseNotification(buildCaseNotificationData(caseData))
      await fetchPendingData()
    } catch (error) {
      console.error('審核案件失敗:', error)
      toast.error(error instanceof Error ? error.message : '審核案件失敗')
    } finally {
      setProcessing(false)
    }
  }

  const handleCaseReject = async (docId: string) => {
    if (processing) return
    setProcessing(true)
    try {
      const caseRef = doc(db, 'cases', docId)
      const caseSnapshot = await getDoc(caseRef)
      if (!caseSnapshot.exists()) throw new Error('找不到案件資料')

      const caseData = caseSnapshot.data() as TutorCase
      await deleteStorageAsset(caseData.idCardUrl)
      await deleteDoc(caseRef)
      toast.success('已拒絕案件')
      await fetchPendingData()
    } catch (error) {
      console.error('拒絕案件失敗:', error)
      toast.error(error instanceof Error ? error.message : '拒絕案件失敗')
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const adminSnapshot = await getDocs(query(collection(db, 'admins'), where('email', '==', nextUser.email)))
        if (adminSnapshot.empty) {
          await signOut(auth)
          toast.error('您沒有管理員權限')
          setUser(null)
        } else {
          setUser(nextUser)
          await fetchPendingData()
        }
      } catch (error) {
        console.error('檢查管理員權限失敗:', error)
        toast.error('管理員權限驗證失敗')
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('已登出')
    } catch (error) {
      console.error('登出失敗:', error)
      toast.error('登出失敗')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3e8]">
        <div className="inline-flex items-center gap-3 rounded-full border border-brand-200 bg-white px-5 py-3 text-brand-800 shadow-[0_14px_40px_rgba(67,102,78,0.08)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          載入管理後台中...
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3e8] px-4">
        <Card className="w-full max-w-lg rounded-[2rem] border-brand-100 bg-white/95 shadow-[0_26px_90px_rgba(67,102,78,0.08)]">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-3xl text-brand-900">管理後台登入</CardTitle>
            <p className="mt-2 text-sm leading-7 text-neutral-600">登入後可查看待審核教師、案件狀態、補件連結與搜尋資料。</p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f3e8] px-4 py-6 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,250,242,0.9))] p-6 shadow-[0_30px_90px_rgba(67,102,78,0.12)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-4 py-2 text-xs font-semibold tracking-[0.28em] text-brand-700">
                <LayoutDashboard className="h-4 w-4" />
                OPERATIONS DASHBOARD
              </div>
              <h1 className="mt-5 font-display text-3xl text-brand-900 md:text-5xl">把待審核案件、教師名單與補件流程放進同一個工作台</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-600">這裡會同時顯示媒合新案、案件補件狀態與教師待審核列表。資料以新的 budgetRange、半完整地址與補件狀態為主，但仍向後相容既有案件。</p>
            </div>
            <Button variant="outline" className="rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              登出
            </Button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <MetricCard label="待審核教師" value={String(pendingTutors.length)} hint="等待審核的教師資料" />
            <MetricCard label="待審核案件" value={String(pendingCases.length)} hint="等待顧問確認的新需求" />
            <MetricCard label="待補件案件" value={String(followUpCount)} hint="尚未完成證件補件" />
            <MetricCard label="搜尋模式" value="Case + Tutor" hint="教師編號與案件編號雙入口" />
          </div>
        </div>

        <Tabs defaultValue="cases" className="space-y-5">
          <TabsList className="h-auto w-full justify-start gap-2 rounded-[1.5rem] border border-brand-100 bg-white/90 p-2 shadow-[0_12px_30px_rgba(67,102,78,0.05)]">
            <TabsTrigger value="cases" className="rounded-[1rem] px-4 py-3">待審核案件</TabsTrigger>
            <TabsTrigger value="tutors" className="rounded-[1rem] px-4 py-3">待審核教師</TabsTrigger>
            <TabsTrigger value="search" className="rounded-[1rem] px-4 py-3">搜尋系統</TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="space-y-5">
            <DashboardSection title="待審核案件" subtitle="優先檢查需求是否完整、預算與地址是否清楚，以及是否需要先發送補件連結。">
              <div className="space-y-4">
                {pendingCases.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-brand-200 bg-[#fffdf8] px-4 py-12 text-center text-neutral-500">目前沒有待審核案件</div>
                ) : (
                  pendingCases.map((caseItem) => {
                    const normalizedCase = normalizeCase(caseItem)
                    return (
                      <div key={caseItem.docId} className="rounded-[1.6rem] border border-brand-100 bg-[#fffdf8] p-5 shadow-[0_16px_40px_rgba(67,102,78,0.05)]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge className="bg-brand-100 text-brand-800">案件編號 {caseItem.caseNumber}</Badge>
                              <Badge className={statusStyles[caseItem.status]}>{caseItem.status}</Badge>
                              <DocumentStatusBadge status={normalizedCase.documentStatus} />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">聯絡人</div>
                                <div className="mt-2 text-sm leading-6 text-neutral-700">{caseItem.parentName}<br />{caseItem.parentPhone}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">課程需求</div>
                                <div className="mt-2 text-sm leading-6 text-neutral-700">{caseItem.subject}<br />{normalizedCase.budgetRange}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">地址</div>
                                <div className="mt-2 text-sm leading-6 text-neutral-700">{normalizedCase.location || '尚未填寫'}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">可上課時段</div>
                                <div className="mt-2 text-sm leading-6 text-neutral-700">{caseItem.availableTime}</div>
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="rounded-[1.2rem] bg-white p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">學生狀況</div>
                                <div className="mt-2 text-sm leading-7 text-neutral-700">{caseItem.studentDescription}</div>
                              </div>
                              <div className="rounded-[1.2rem] bg-white p-4">
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">老師條件</div>
                                <div className="mt-2 text-sm leading-7 text-neutral-700">{caseItem.teacherRequirements || '未特別指定'}</div>
                              </div>
                            </div>
                            {caseItem.idCardUrl && (
                              <div className="max-w-lg overflow-hidden rounded-[1.3rem] border border-brand-100 bg-white">
                                <Image src={caseItem.idCardUrl} alt="案件證件照片" width={800} height={480} className="w-full object-cover" />
                              </div>
                            )}
                          </div>

                          <div className="flex w-full flex-col gap-3 lg:w-[18rem]">
                            <Button className="rounded-full bg-brand-500 text-white hover:bg-brand-600" onClick={() => handleCaseApprove(caseItem.docId)} disabled={processing}>
                              通過審核
                            </Button>
                            <Button variant="outline" className="rounded-full border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleCaseReject(caseItem.docId)} disabled={processing}>
                              不通過
                            </Button>
                            <CopyableLinkButton
                              label={normalizedCase.documentStatus === 'requested' ? '重新產生連結' : '產生補件連結'}
                              onClick={() => handleGenerateDocumentLink(caseItem.docId)}
                              disabled={generatingLinkId === caseItem.docId}
                            />
                            <div className="rounded-[1.2rem] border border-brand-100 bg-white p-4 text-sm leading-7 text-neutral-600">
                              <div className="font-semibold text-brand-900">補件狀態</div>
                              <div className="mt-2">{normalizedCase.documentStatusLabel}</div>
                              {caseItem.documentRequestExpiresAt && <div className="mt-2 text-xs text-neutral-500">連結到期：{new Date(caseItem.documentRequestExpiresAt).toLocaleString('zh-TW')}</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </DashboardSection>
          </TabsContent>

          <TabsContent value="tutors">
            <DashboardSection title="待審核教師" subtitle="保留原本教師審核邏輯，改成更一致的營運面板視圖。">
              <div className="space-y-4">
                {pendingTutors.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-brand-200 bg-[#fffdf8] px-4 py-12 text-center text-neutral-500">目前沒有待審核教師</div>
                ) : (
                  pendingTutors.map((tutor) => (
                    <div key={tutor.docId} className="rounded-[1.6rem] border border-brand-100 bg-[#fffdf8] p-5 shadow-[0_16px_40px_rgba(67,102,78,0.05)]">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                              <UserRound className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-xl font-semibold text-brand-900">{tutor.name}</div>
                              <div className="text-sm text-neutral-500">{tutor.school} · {tutor.major}</div>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">聯絡方式</div>
                              <div className="mt-2 text-sm leading-6 text-neutral-700">{tutor.phoneNumber}<br />{tutor.email}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">授課科目</div>
                              <div className="mt-2 text-sm leading-6 text-neutral-700">{tutor.subjects.join('、')}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">教學經驗</div>
                              <div className="mt-2 text-sm leading-6 text-neutral-700">{tutor.experience}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">通知設定</div>
                              <div className="mt-2 text-sm leading-6 text-neutral-700">{tutor.receiveNewCaseNotifications ? '接收新案件通知' : '不接收新案件通知'}</div>
                            </div>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="overflow-hidden rounded-[1.2rem] border border-brand-100 bg-white">
                              <Image src={tutor.studentIdCardUrl} alt="學生證" width={800} height={480} className="w-full object-cover" />
                            </div>
                            <div className="overflow-hidden rounded-[1.2rem] border border-brand-100 bg-white">
                              <Image src={tutor.idCardUrl} alt="身分證" width={800} height={480} className="w-full object-cover" />
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-3 lg:w-[16rem]">
                          <Button className="rounded-full bg-brand-500 text-white hover:bg-brand-600" onClick={() => handleTutorApprove(tutor.docId)} disabled={processing}>
                            通過審核
                          </Button>
                          <Button variant="outline" className="rounded-full border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleTutorReject(tutor.docId)} disabled={processing}>
                            退回補件
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DashboardSection>
          </TabsContent>

          <TabsContent value="search">
            <div className="space-y-5">
              <DashboardSection title="搜尋系統" subtitle="可直接用教師編號或案件編號查詢，並針對案件狀態與補件流程做後續操作。">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div>
                    <LabelledField label="教師編號">
                      <Input value={tutorCode} onChange={(event) => setTutorCode(event.target.value)} placeholder="例如：T001" />
                    </LabelledField>
                  </div>
                  <div>
                    <LabelledField label="案件編號">
                      <Input value={caseNumber} onChange={(event) => setCaseNumber(event.target.value)} placeholder="例如：CABC123" />
                    </LabelledField>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button className="rounded-full bg-brand-500 text-white hover:bg-brand-600" onClick={handleSearch} disabled={searching}>
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      開始搜尋
                    </Button>
                    <Button variant="outline" className="rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50" onClick={clearSearch}>
                      清除
                    </Button>
                  </div>
                </div>
              </DashboardSection>

              {searchResults.tutor && (
                <DashboardSection title="教師搜尋結果" subtitle="教師資料維持原本審核欄位，但用新的儀表板版型呈現。">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
                    <div className="rounded-[1.5rem] border border-brand-100 bg-[#fffdf8] p-5">
                      <div className="text-2xl font-semibold text-brand-900">{searchResults.tutor.name}</div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <SummaryBlock label="聯絡方式" value={`${searchResults.tutor.phoneNumber}\n${searchResults.tutor.email}`} />
                        <SummaryBlock label="教學背景" value={`${searchResults.tutor.school}\n${searchResults.tutor.major}`} />
                        <SummaryBlock label="授課科目" value={searchResults.tutor.subjects.join('、')} />
                        <SummaryBlock label="教學經驗" value={searchResults.tutor.experience} />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                      {searchResults.tutor.idCardUrl && (
                        <div className="overflow-hidden rounded-[1.5rem] border border-brand-100 bg-white">
                          <Image src={searchResults.tutor.idCardUrl} alt="身分證" width={640} height={420} className="w-full object-cover" />
                        </div>
                      )}
                      {searchResults.tutor.studentIdCardUrl && (
                        <div className="overflow-hidden rounded-[1.5rem] border border-brand-100 bg-white">
                          <Image src={searchResults.tutor.studentIdCardUrl} alt="學生證" width={640} height={420} className="w-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </DashboardSection>
              )}

              {searchResults.case && (() => {
                const normalizedCase = normalizeCase(searchResults.case)
                return (
                  <DashboardSection title="案件搜尋結果" subtitle="支援新的 budgetRange、地址摘要與補件連結流程，也能更新案件狀態。">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                      <div className="space-y-4 rounded-[1.5rem] border border-brand-100 bg-[#fffdf8] p-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className="bg-brand-100 text-brand-800">案件編號 {searchResults.case.caseNumber}</Badge>
                          <Badge className={statusStyles[searchResults.case.status]}>{searchResults.case.status}</Badge>
                          <DocumentStatusBadge status={normalizedCase.documentStatus} />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <SummaryBlock label="家長資訊" value={`${searchResults.case.parentName}\n${searchResults.case.parentPhone}`} />
                          <SummaryBlock label="課程資訊" value={`${searchResults.case.subject}\n${normalizedCase.budgetRange}`} />
                          <SummaryBlock label="地址" value={normalizedCase.location || '未填寫'} />
                          <SummaryBlock label="可上課時間" value={searchResults.case.availableTime} />
                        </div>
                        <SummaryBlock label="學生狀況" value={searchResults.case.studentDescription} />
                        <SummaryBlock label="教師要求" value={searchResults.case.teacherRequirements || '未特別指定'} />
                        {searchResults.case.idCardUrl && (
                          <div className="overflow-hidden rounded-[1.5rem] border border-brand-100 bg-white">
                            <Image src={searchResults.case.idCardUrl} alt="身分證照片" width={720} height={420} className="w-full object-cover" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[1.5rem] border border-brand-100 bg-white p-5 shadow-[0_14px_40px_rgba(67,102,78,0.06)]">
                          <div className="text-sm font-semibold tracking-[0.22em] text-brand-500">案件狀態</div>
                          <div className="mt-4 grid gap-3">
                            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as typeof selectedStatus)}>
                              <SelectTrigger className="h-11 rounded-2xl border-brand-200 bg-[#fffdf8]">
                                <SelectValue placeholder="選擇新狀態" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="急徵">急徵</SelectItem>
                                <SelectItem value="有人接洽">有人接洽</SelectItem>
                                <SelectItem value="已徵到">已徵到</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button className="rounded-full bg-brand-500 text-white hover:bg-brand-600" onClick={() => selectedStatus && handleCaseStatusUpdate(searchResults.case!.docId, selectedStatus)} disabled={!selectedStatus || updatingStatus}>
                              {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              更新案件狀態
                            </Button>
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-brand-100 bg-white p-5 shadow-[0_14px_40px_rgba(67,102,78,0.06)]">
                          <div className="text-sm font-semibold tracking-[0.22em] text-brand-500">補件狀態</div>
                          <div className="mt-3 flex items-center gap-3">
                            <DocumentStatusBadge status={normalizedCase.documentStatus} />
                            {searchResults.case.documentRequestExpiresAt && <span className="text-xs text-neutral-500">到期：{new Date(searchResults.case.documentRequestExpiresAt).toLocaleString('zh-TW')}</span>}
                          </div>
                          <div className="mt-4 flex flex-col gap-2">
                            <CopyableLinkButton
                              label={normalizedCase.documentStatus === 'requested' ? '重新產生連結' : '產生補件連結'}
                              onClick={() => handleGenerateDocumentLink(searchResults.case!.docId)}
                              disabled={generatingLinkId === searchResults.case!.docId}
                            />
                            <Button type="button" variant="outline" size="sm" className="rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50" onClick={() => handleGenerateDocumentLink(searchResults.case!.docId)} disabled={generatingLinkId === searchResults.case!.docId}>
                              <Link2 className="h-4 w-4" />
                              補件狀態與連結操作
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DashboardSection>
                )
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(revisionDialogTutor)} onOpenChange={(open) => (!open ? closeRevisionDialog() : null)}>
        <DialogContent className="max-w-2xl rounded-[2rem] border border-brand-100 bg-[#fffdf8] p-0">
          <DialogHeader className="border-b border-brand-100 px-6 py-5">
            <DialogTitle className="font-display text-2xl text-brand-900">退回補件</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-7 text-neutral-600">
              {revisionDialogTutor
                ? `為 ${revisionDialogTutor.name} 選擇需要補充的項目。送出後會寄 email 通知，老師可回到原申請重新提交案件。`
                : '選擇退件理由後，系統會自動寄送補件通知。'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-3 md:grid-cols-2">
              {TUTOR_REVISION_REASON_OPTIONS.map((option) => (
                <label key={option.code} className="flex items-start gap-3 rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4">
                  <Checkbox
                    checked={selectedRevisionReasons.includes(option.code)}
                    onCheckedChange={(checked) => toggleRevisionReason(option.code, Boolean(checked))}
                  />
                  <div>
                    <div className="text-sm font-semibold text-brand-900">{option.label}</div>
                    <div className="mt-1 text-xs text-neutral-500">{option.code}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-900">補充說明</label>
              <Textarea
                value={revisionNote}
                onChange={(event) => setRevisionNote(event.target.value)}
                placeholder="可補充具體需要修改的欄位、重拍建議或其他提醒。若勾選 other，這裡必須填寫。"
                className="min-h-[140px] rounded-[1.25rem] border-brand-200 bg-white"
              />
              <div className="text-xs text-neutral-500">
                已選擇 {selectedRevisionReasons.length} 個退件理由
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-brand-100 px-6 py-5">
            <Button type="button" variant="outline" className="rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50" onClick={closeRevisionDialog} disabled={processing}>
              取消
            </Button>
            <Button
              type="button"
              className="rounded-full bg-brand-500 text-white hover:bg-brand-600"
              onClick={handleTutorRevisionSubmit}
              disabled={processing || selectedRevisionReasons.length === 0 || (selectedRevisionReasons.includes('other') && !revisionNote.trim())}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              寄送退回補件通知
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LabelledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-brand-900">
      <span>{label}</span>
      {children}
    </label>
  )
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-brand-100 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">{label}</div>
      <div className="mt-2 whitespace-pre-line text-sm leading-7 text-neutral-700">{value}</div>
    </div>
  )
}
