'use client'

import Image from 'next/image'
import type { FormEvent } from 'react'
import { ArrowLeft, Clock, Home, RefreshCw, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { SubjectType } from '@/components/solver/types'
import { MobileThreadToggle } from '@/components/solver/SolverThreadDrawer'
import styles from '@/components/solver/solver.module.css'

interface SolverQuestionStepProps {
  subjectType: SubjectType | null
  imagePreview: string | null
  currentQuestion: string
  loading: boolean
  timeoutWarning: boolean
  apiTimeout: boolean
  retryCount: number
  presets: string[]
  onQuestionChange: (value: string) => void
  onPresetSelect: (value: string) => void
  onSubmit: (e?: FormEvent | null) => Promise<void>
  onBack: () => void
  onRetry: () => Promise<void>
  onClearTimeout: () => void
  onOpenThreads: () => void
  onGoMainPage: () => void
}

const subjectLabelMap: Record<SubjectType, string> = {
  math: '數理科目',
  other: '其他科目',
}

const subjectBadgeClassMap: Record<SubjectType, string> = {
  math: 'bg-brand-100 text-brand-700',
  other: 'bg-[#dfeecf] text-brand-700',
}

export default function SolverQuestionStep({
  subjectType,
  imagePreview,
  currentQuestion,
  loading,
  timeoutWarning,
  apiTimeout,
  retryCount,
  presets,
  onQuestionChange,
  onPresetSelect,
  onSubmit,
  onBack,
  onRetry,
  onClearTimeout,
  onOpenThreads,
  onGoMainPage,
}: SolverQuestionStepProps) {
  return (
    <section className="flex h-full min-h-0 flex-col" data-solver-question-step>
      <header className="border-b border-brand-100/80 bg-white/78 px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 min-w-11 rounded-full text-brand-700 hover:bg-brand-50"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-brand-500">QUESTION</p>
              <h1 className={`text-lg text-brand-900 ${styles.displayHeading}`}>輸入你想問的重點</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <MobileThreadToggle onClick={onOpenThreads} />
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 min-w-11 rounded-full text-brand-700 hover:bg-brand-50"
              onClick={onGoMainPage}
              title="回到主站"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="scrollbar-hide flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-6">
          {subjectType ? (
            <span
              className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] ${subjectBadgeClassMap[subjectType]}`}
            >
              {subjectLabelMap[subjectType]}
            </span>
          ) : null}

          {imagePreview ? (
            <article className="overflow-hidden rounded-[1.6rem] border border-brand-100 bg-white/95 shadow-[0_20px_40px_rgba(66,122,91,0.1)]">
              <div className="border-b border-brand-100/80 px-4 py-3">
                <h2 className="text-sm font-semibold text-neutral-700">題目圖片</h2>
              </div>
              <div className="bg-[#f9f6ed] p-4">
                <button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    window.open(imagePreview, '_blank')
                  }}
                  title="開啟原圖"
                >
                  <Image
                    src={imagePreview}
                    alt="題目圖片"
                    width={900}
                    height={640}
                    className="h-auto max-h-[360px] w-full rounded-xl object-contain"
                    unoptimized
                  />
                </button>
              </div>
            </article>
          ) : null}

          <article className="rounded-[1.6rem] border border-brand-100 bg-white/92 p-4 shadow-[0_16px_36px_rgba(66,122,91,0.08)] sm:p-5">
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault()
                await onSubmit(event)
              }}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">請輸入問題</span>
                <Textarea
                  value={currentQuestion}
                  onChange={(event) => onQuestionChange(event.target.value)}
                  placeholder={
                    subjectType === 'math'
                      ? '例如：這題怎麼解？請幫我分析關鍵步驟...'
                      : '例如：這題怎麼解？請幫我整理重點概念...'
                  }
                  className="min-h-[132px] resize-none rounded-2xl border-brand-200 bg-white/95 text-[15px] focus-visible:ring-brand-200"
                  disabled={loading}
                />
              </label>

              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                {presets.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11 shrink-0 rounded-full border-brand-200 bg-white text-xs text-brand-700 hover:bg-brand-50"
                    onClick={() => onPresetSelect(preset)}
                    disabled={loading}
                  >
                    {preset}
                  </Button>
                ))}
              </div>

              <Button
                type="submit"
                className="min-h-11 w-full rounded-full bg-brand-500 text-white shadow-[0_16px_30px_rgba(66,122,91,0.2)] hover:bg-brand-600"
                disabled={loading || !currentQuestion.trim()}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    分析中...
                    {timeoutWarning ? <span className="text-orange-100">（處理時間較長）</span> : null}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    開始解題
                  </>
                )}
              </Button>
            </form>
          </article>

          {apiTimeout ? (
            <article className="rounded-[1.4rem] border border-orange-200 bg-[linear-gradient(130deg,rgba(255,247,237,0.95),rgba(255,237,213,0.78))] p-4 shadow-[0_12px_28px_rgba(249,115,22,0.1)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-orange-900">處理時間過長</h3>
                  <p className="mt-1 text-sm leading-6 text-orange-800">
                    題目可能較複雜或連線不穩定，建議重試一次，系統會沿用同一題目重新處理。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={onRetry}
                      className="min-h-11 rounded-full bg-orange-500 text-white hover:bg-orange-600"
                      disabled={loading}
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      重試{retryCount > 0 ? ` (${retryCount + 1})` : ''}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClearTimeout}
                      className="min-h-11 rounded-full border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  )
}
