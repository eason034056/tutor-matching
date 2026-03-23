'use client'

import { useEffect, useMemo, useState } from 'react'
import { ApprovedCase } from '@/server/types/index'
import { normalizeCase } from '@/lib/case-utils'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from 'next/link'
import { query, getDocs } from 'firebase/firestore'
import { approvedCasesCollection } from '@/server/config/firebase'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ChevronDown, CircleAlert, Filter, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'

const itemsPerPage = 10

const REGION_OPTIONS = [
  'all',
  '線上',
  '台北',
  '基隆',
  '新北',
  '桃園',
  '新竹',
  '苗栗',
  '台中',
  '彰化',
  '南投',
  '雲林',
  '嘉義',
  '台南',
  '高雄',
  '屏東',
  '宜蘭',
  '花蓮',
  '台東',
] as const

type StatusFilter = 'all' | ApprovedCase['status']

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: '全部狀態' },
  { value: '急徵', label: '急徵' },
  { value: '有人接洽', label: '有人接洽' },
  { value: '已徵到', label: '已徵到' },
]

const STATUS_ORDER: Record<ApprovedCase['status'], number> = {
  急徵: 0,
  有人接洽: 1,
  已徵到: 2,
}

const getStatusBadgeVariant = (status: ApprovedCase['status']) => {
  if (status === '急徵') {
    return 'destructive' as const
  }
  return 'secondary' as const
}

const getStatusBadgeClassName = (status: ApprovedCase['status']) => {
  if (status === '急徵') {
    return 'bg-red-500/90 text-white shadow-[0_10px_24px_rgba(239,68,68,0.28)]'
  }
  if (status === '有人接洽') {
    return 'bg-amber-100 text-amber-800'
  }
  return 'bg-neutral-200 text-neutral-600'
}

const getRegionLabel = (region: string) => (region === 'all' ? '所有地區' : region)

export default function TutorCasesClient() {
  const [selectedApplyCase, setSelectedApplyCase] = useState<ApprovedCase | null>(null)
  const [selectedDetailCase, setSelectedDetailCase] = useState<ApprovedCase | null>(null)
  const [approvedCases, setApprovedCases] = useState<ApprovedCase[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all')

  useEffect(() => {
    const fetchApprovedCases = async () => {
      try {
        setLoadError(null)

        const cachedData = sessionStorage.getItem('approvedCases')
        const cachedTimestamp = sessionStorage.getItem('approvedCasesTimestamp')

        if (cachedData && cachedTimestamp) {
          const now = Date.now()
          const cacheTime = parseInt(cachedTimestamp, 10)
          const tenMinutes = 10 * 60 * 1000

          if (!Number.isNaN(cacheTime) && now - cacheTime < tenMinutes) {
            try {
              const parsedCases = JSON.parse(cachedData) as ApprovedCase[]
              setApprovedCases(parsedCases)
              return
            } catch {
              sessionStorage.removeItem('approvedCases')
              sessionStorage.removeItem('approvedCasesTimestamp')
            }
          }
        }

        const q = query(approvedCasesCollection)
        const querySnapshot = await getDocs(q)
        const casesList: ApprovedCase[] = querySnapshot.docs.map((doc) => ({
          ...(doc.data() as ApprovedCase),
          caseId: doc.id,
        }))

        setApprovedCases(casesList)
        sessionStorage.setItem('approvedCases', JSON.stringify(casesList))
        sessionStorage.setItem('approvedCasesTimestamp', Date.now().toString())
      } catch (error) {
        console.error('Failed to load approved cases:', error)
        setLoadError('案件資料暫時載入失敗，請稍後再試一次。')
      } finally {
        setLoading(false)
      }
    }

    fetchApprovedCases()
  }, [])

  const canApply = (tutorCase: ApprovedCase) => {
    if (tutorCase.status === '已徵到' || tutorCase.status === '有人接洽') return false
    return tutorCase.status === '急徵'
  }

  const normalizedCases = useMemo(
    () => approvedCases.map((tutorCase) => normalizeCase(tutorCase)),
    [approvedCases]
  )

  const filteredAndSortedCases = useMemo(() => {
    return [...normalizedCases]
      .filter((tutorCase) => {
        const regionMatched = selectedRegion === 'all' || tutorCase.region === selectedRegion
        const statusMatched = selectedStatus === 'all' || tutorCase.status === selectedStatus
        return regionMatched && statusMatched
      })
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  }, [normalizedCases, selectedRegion, selectedStatus])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCases.length / itemsPerPage))

  const currentPageItems = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages)
    const startIndex = (safePage - 1) * itemsPerPage
    return filteredAndSortedCases.slice(startIndex, startIndex + itemsPerPage)
  }, [currentPage, filteredAndSortedCases, totalPages])

  const urgentCount = useMemo(
    () => filteredAndSortedCases.filter((tutorCase) => tutorCase.status === '急徵').length,
    [filteredAndSortedCases]
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return
    setCurrentPage(pageNumber)
  }

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: StatusFilter) => {
    setSelectedStatus(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedRegion('all')
    setSelectedStatus('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = selectedRegion !== 'all' || selectedStatus !== 'all'

  const renderLoadingState = () => (
    <>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`mobile-loading-${index}`}
            className="animate-pulse rounded-2xl border border-brand-100 bg-white/85 p-4 shadow-[0_14px_32px_rgba(66,122,91,0.08)]"
          >
            <div className="mb-4 h-4 w-24 rounded bg-brand-100/70" />
            <div className="mb-3 h-6 w-2/3 rounded bg-brand-100/60" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 rounded-xl bg-brand-100/50" />
              <div className="h-12 rounded-xl bg-brand-100/50" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden rounded-2xl border border-brand-100 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {['案件編號', '科目 / 年級', '時薪', '地區 / 地點', '狀態', '操作'].map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={`desktop-loading-${rowIndex}`}>
                {Array.from({ length: 6 }).map((_, cellIndex) => (
                  <TableCell key={`desktop-loading-${rowIndex}-${cellIndex}`}>
                    <div className="h-4 animate-pulse rounded bg-brand-100/60" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/70 px-5 py-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-600 shadow-[0_16px_30px_rgba(66,122,91,0.14)]">
        <SearchX className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-brand-900">目前沒有符合條件的家教案件</h3>
      <p className="mt-2 text-sm leading-7 text-neutral-600">
        你目前選擇的是「{getRegionLabel(selectedRegion)}」與「{STATUS_FILTER_OPTIONS.find((option) => option.value === selectedStatus)?.label}」。
      </p>
      {hasActiveFilters ? (
        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="min-h-10 rounded-full border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
          >
            重設篩選
          </Button>
        </div>
      ) : null}
    </div>
  )

  const renderApplyDialogBody = (tutorCase: ApprovedCase) => (
    <>
      <DialogHeader className="border-b border-brand-100 bg-[linear-gradient(140deg,rgba(255,255,255,0.98),rgba(245,250,242,0.95))] px-5 pb-4 pt-5 text-left">
        <DialogTitle className="font-display text-2xl text-brand-900">應徵案件</DialogTitle>
        <p className="mt-2 text-sm text-neutral-600">案件編號：{tutorCase.caseNumber}</p>
      </DialogHeader>

      <div className="max-h-[75vh] space-y-4 overflow-y-auto px-5 py-5 mobile-safe-bottom">
        <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
          <p className="mb-2 text-sm font-semibold text-brand-800">接案須知</p>
          <p className="text-sm leading-7 text-brand-800">
            請加入家教中心 Line 帳號，並傳送您的家教編號，家教中心會盡快與您聯絡。若還沒進行教師編號，請先至
            <Link href="/tutor-registration" className="mx-1 font-semibold underline decoration-brand-400 underline-offset-4">
              教師登錄
            </Link>
            頁面進行登錄。填完資料後大約 1-2 天會收到教師編號。
          </p>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-4">
          <p className="text-sm font-semibold text-brand-900">家教中心 Line ID</p>
          <p className="mt-2 text-lg font-semibold tracking-wide text-brand-700">home-tutor-tw</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm leading-7 text-amber-800">
            提醒：請務必在收到家長聯絡資訊後三天內透過 Line 回報試教時間，以確保案件不會被重新開放。
          </p>
        </div>

        <div className="pt-2">
          <DialogClose asChild>
            <Button className="min-h-11 w-full rounded-full bg-brand-600 text-white hover:bg-brand-700">
              我知道了
            </Button>
          </DialogClose>
        </div>
      </div>
    </>
  )

  return (
    <div className="relative overflow-hidden bg-[#f7f3e8] text-neutral-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(180,205,147,0.42),_transparent_45%),radial-gradient(circle_at_top_right,_rgba(66,122,91,0.16),_transparent_35%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.36),transparent_26%,transparent_84%,rgba(255,255,255,0.2))]" />

      <section className="relative px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-4 md:space-y-6">
          <Card className="overflow-hidden rounded-[1.8rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,250,242,0.94))] shadow-[0_24px_72px_rgba(67,102,78,0.12)]">
            <CardHeader className="space-y-4 p-5 md:p-7">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-brand-700">
                <Filter className="h-4 w-4" />
                CASE DASHBOARD
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="font-display text-[2rem] leading-[1.05] text-brand-900 md:text-[2.5rem]">
                    所有家教案件
                  </CardTitle>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 md:text-base">
                    歡迎來到家教案件專區！這裡匯整了最新、最適合的家教案件，您可依地區與條件挑選，有疑問請隨時詢問，祝您順利找到理想案件！
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm md:w-[250px]">
                  <div className="rounded-2xl border border-brand-100 bg-white/90 px-4 py-3">
                    <p className="text-xs text-neutral-500">符合條件</p>
                    <p className="mt-1 text-xl font-semibold text-brand-900">{filteredAndSortedCases.length}</p>
                  </div>
                  <div className="rounded-2xl border border-brand-100 bg-white/90 px-4 py-3">
                    <p className="text-xs text-neutral-500">急徵案件</p>
                    <p className="mt-1 text-xl font-semibold text-red-600">{urgentCount}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden rounded-[1.8rem] border border-brand-100/80 bg-white/95 shadow-[0_22px_70px_rgba(67,102,78,0.1)]">
            <CardContent className="p-4 md:p-6">
              <div className="sticky top-0 z-30 mb-6 rounded-2xl border border-brand-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,250,242,0.96))] p-3 shadow-[0_14px_30px_rgba(66,122,91,0.1)] backdrop-blur md:static md:p-4 md:shadow-none">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="w-full md:w-[220px]">
                    <Select value={selectedRegion} onValueChange={handleRegionChange}>
                      <SelectTrigger className="min-h-11 rounded-xl border-brand-200 bg-white text-brand-900">
                        <SelectValue placeholder="選擇地區" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGION_OPTIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {getRegionLabel(region)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex min-h-11 flex-wrap items-center gap-2 pt-1 md:justify-end md:pt-0">
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleStatusChange(option.value)}
                        className={cn(
                          'shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-[1px] motion-reduce:transform-none motion-reduce:transition-none',
                          selectedStatus === option.value
                            ? 'border-brand-600 bg-brand-600 text-white shadow-[0_12px_24px_rgba(66,122,91,0.24)]'
                            : 'border-brand-200 bg-white text-brand-800 hover:bg-brand-50'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loadError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-red-700">
                  <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-sm leading-7">{loadError}</p>
                  </div>
                </div>
              ) : loading ? (
                renderLoadingState()
              ) : filteredAndSortedCases.length === 0 ? (
                renderEmptyState()
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {currentPageItems.map((tutorCase, index) => (
                      <article
                        key={tutorCase.caseId}
                        style={{ animationDelay: `${index * 70}ms` }}
                        className="animate-in slide-in-from-bottom-2 fade-in rounded-2xl border border-brand-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,249,242,0.94))] p-4 shadow-[0_16px_38px_rgba(66,122,91,0.08)] duration-500 motion-reduce:animate-none"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold tracking-[0.15em] text-brand-500">案件編號</p>
                            <p className="mt-1 text-base font-semibold text-brand-900">{tutorCase.caseNumber}</p>
                          </div>
                          <Badge
                            variant={getStatusBadgeVariant(tutorCase.status)}
                            className={cn('rounded-full px-3 py-1 text-xs', getStatusBadgeClassName(tutorCase.status))}
                          >
                            {tutorCase.status}
                          </Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2">
                            <p className="text-xs text-neutral-500">科目</p>
                            <p className="mt-1 font-medium text-neutral-800">{tutorCase.subject}</p>
                          </div>
                          <div className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2">
                            <p className="text-xs text-neutral-500">年級</p>
                            <p className="mt-1 font-medium text-neutral-800">{tutorCase.grade}</p>
                          </div>
                          <div className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2">
                            <p className="text-xs text-neutral-500">時薪</p>
                            <p className="mt-1 font-medium text-neutral-800">{tutorCase.budgetRange}</p>
                          </div>
                          <div className="rounded-xl border border-brand-100 bg-white/90 px-3 py-2">
                            <p className="text-xs text-neutral-500">地區</p>
                            <p className="mt-1 font-medium text-neutral-800">{tutorCase.region}</p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-xl border border-brand-100 bg-white/90 px-3 py-2 text-sm">
                          <p className="text-xs text-neutral-500">上課地點</p>
                          <p className="mt-1 font-medium leading-6 text-neutral-800">{tutorCase.location}</p>
                        </div>

                        <details className="mt-3 rounded-xl border border-brand-100 bg-white/90">
                          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium text-brand-800">
                            更多資訊
                            <ChevronDown className="h-4 w-4" />
                          </summary>
                          <div className="space-y-2 border-t border-brand-100 px-3 py-3 text-sm leading-7 text-neutral-700">
                            <div>
                              <p className="text-xs text-neutral-500">可上課時段</p>
                              <p>{tutorCase.availableTime}</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500">教師條件</p>
                              <p>{tutorCase.teacherRequirements?.trim() || '未特別註明'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500">學生狀況</p>
                              <p>{tutorCase.studentDescription?.trim() || '未提供'}</p>
                            </div>
                          </div>
                        </details>

                        <div className="mt-4">
                          <Button
                            type="button"
                            variant={canApply(tutorCase) ? 'default' : 'outline'}
                            disabled={!canApply(tutorCase)}
                            onClick={() => setSelectedApplyCase(tutorCase)}
                            className={cn(
                              'min-h-11 w-full rounded-full text-sm font-semibold transition-all duration-200 motion-reduce:transition-none',
                              canApply(tutorCase)
                                ? 'bg-brand-600 text-white hover:bg-brand-700'
                                : 'border-brand-200 text-neutral-500'
                            )}
                          >
                            應徵
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="hidden overflow-hidden rounded-2xl border border-brand-100 md:block">
                    <Table>
                      <TableHeader className="bg-brand-50/70">
                        <TableRow>
                          <TableHead className="w-[120px]">案件編號</TableHead>
                          <TableHead>科目 / 年級</TableHead>
                          <TableHead className="w-[160px]">時薪</TableHead>
                          <TableHead>地區 / 地點</TableHead>
                          <TableHead className="w-[120px]">狀態</TableHead>
                          <TableHead className="w-[260px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentPageItems.map((tutorCase) => (
                          <TableRow key={tutorCase.caseId} className="transition-colors hover:bg-brand-50/50">
                            <TableCell className="font-semibold text-brand-900">{tutorCase.caseNumber}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium text-neutral-800">{tutorCase.subject}</p>
                                <p className="text-sm text-neutral-500">{tutorCase.grade}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-neutral-700">{tutorCase.budgetRange}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium text-neutral-800">{tutorCase.region}</p>
                                <p className="line-clamp-2 text-sm text-neutral-500">{tutorCase.location}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusBadgeVariant(tutorCase.status)}
                                className={cn('rounded-full px-3 py-1 text-xs', getStatusBadgeClassName(tutorCase.status))}
                              >
                                {tutorCase.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setSelectedDetailCase(tutorCase)}
                                  className="rounded-full border-brand-200 text-brand-800 hover:bg-brand-50"
                                >
                                  查看詳情
                                </Button>
                                <Button
                                  type="button"
                                  variant={canApply(tutorCase) ? 'default' : 'outline'}
                                  disabled={!canApply(tutorCase)}
                                  onClick={() => setSelectedApplyCase(tutorCase)}
                                  className={cn(
                                    'rounded-full',
                                    canApply(tutorCase)
                                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                                      : 'border-brand-200 text-neutral-500'
                                  )}
                                >
                                  應徵
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-2 md:hidden">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 flex-1 rounded-full border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      上一頁
                    </Button>
                    <p className="min-w-16 text-center text-sm font-medium text-neutral-600">
                      {currentPage} / {totalPages}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 flex-1 rounded-full border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      下一頁
                    </Button>
                  </div>

                  <div className="mt-6 hidden items-center justify-center gap-2 md:flex">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-brand-200 text-brand-800 hover:bg-brand-50"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      上一頁
                    </Button>

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        type="button"
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          'h-10 w-10 rounded-full',
                          currentPage === pageNum
                            ? 'bg-brand-600 text-white hover:bg-brand-700'
                            : 'border-brand-200 text-brand-800 hover:bg-brand-50'
                        )}
                      >
                        {pageNum}
                      </Button>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-brand-200 text-brand-800 hover:bg-brand-50"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      下一頁
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={Boolean(selectedApplyCase)} onOpenChange={(open) => !open && setSelectedApplyCase(null)}>
        {selectedApplyCase ? (
          <DialogContent className="left-0 right-0 bottom-0 top-auto z-50 grid max-h-[92vh] w-full max-w-none translate-x-0 translate-y-0 overflow-hidden gap-0 rounded-t-[1.6rem] rounded-b-none border border-brand-100 bg-[#fffdf8] p-0 shadow-[0_-24px_70px_rgba(31,58,45,0.26)] data-[state=closed]:slide-out-to-bottom-8 data-[state=open]:slide-in-from-bottom-8 motion-reduce:transition-none md:left-[50%] md:right-auto md:top-[50%] md:bottom-auto md:max-h-[86vh] md:w-full md:max-w-[540px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.6rem] md:border-brand-100 md:data-[state=closed]:slide-out-to-top-[48%] md:data-[state=open]:slide-in-from-top-[48%]">
            {renderApplyDialogBody(selectedApplyCase)}
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(selectedDetailCase)} onOpenChange={(open) => !open && setSelectedDetailCase(null)}>
        {selectedDetailCase ? (
          <DialogContent className="max-h-[86vh] overflow-hidden rounded-[1.4rem] border border-brand-100 bg-[#fffdf8] p-0 md:max-w-[640px]">
            <DialogHeader className="border-b border-brand-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,250,242,0.94))] px-6 pb-4 pt-6 text-left">
              <DialogTitle className="font-display text-2xl text-brand-900">案件詳情</DialogTitle>
              <p className="mt-2 text-sm text-neutral-600">案件編號：{selectedDetailCase.caseNumber}</p>
            </DialogHeader>
            <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-brand-100 bg-white p-3">
                  <p className="text-xs text-neutral-500">科目</p>
                  <p className="mt-1 font-medium text-neutral-800">{selectedDetailCase.subject}</p>
                </div>
                <div className="rounded-xl border border-brand-100 bg-white p-3">
                  <p className="text-xs text-neutral-500">年級</p>
                  <p className="mt-1 font-medium text-neutral-800">{selectedDetailCase.grade}</p>
                </div>
                <div className="rounded-xl border border-brand-100 bg-white p-3">
                  <p className="text-xs text-neutral-500">地區</p>
                  <p className="mt-1 font-medium text-neutral-800">{selectedDetailCase.region}</p>
                </div>
                <div className="rounded-xl border border-brand-100 bg-white p-3">
                  <p className="text-xs text-neutral-500">時薪</p>
                  <p className="mt-1 font-medium text-neutral-800">{selectedDetailCase.budgetRange}</p>
                </div>
              </div>

              <div className="space-y-4 text-sm leading-7 text-neutral-700">
                <div className="rounded-xl border border-brand-100 bg-white p-4">
                  <p className="text-xs text-neutral-500">上課地點</p>
                  <p className="mt-1">{selectedDetailCase.location}</p>
                </div>
                <div className="rounded-xl border border-brand-100 bg-white p-4">
                  <p className="text-xs text-neutral-500">可上課時段</p>
                  <p className="mt-1">{selectedDetailCase.availableTime}</p>
                </div>
                <div className="rounded-xl border border-brand-100 bg-white p-4">
                  <p className="text-xs text-neutral-500">教師條件</p>
                  <p className="mt-1">{selectedDetailCase.teacherRequirements?.trim() || '未特別註明'}</p>
                </div>
                <div className="rounded-xl border border-brand-100 bg-white p-4">
                  <p className="text-xs text-neutral-500">學生狀況</p>
                  <p className="mt-1">{selectedDetailCase.studentDescription?.trim() || '未提供'}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}
