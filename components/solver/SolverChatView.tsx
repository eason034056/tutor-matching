'use client'

import { useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import Image from 'next/image'
import { ArrowLeft, Clock, Home, RefreshCw, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarkdownMessage } from '@/components/MarkdownMessage'
import { MobileThreadToggle } from '@/components/solver/SolverThreadDrawer'
import type { MessageWithMeta, SubjectType } from '@/components/solver/types'
import styles from '@/components/solver/solver.module.css'

interface SolverChatViewProps {
  subjectType: SubjectType | null
  messages: MessageWithMeta[]
  input: string
  loading: boolean
  isLoadingMessages: boolean
  currentWaitTime: number
  timeoutWarning: boolean
  apiTimeout: boolean
  retryCount: number
  presets: string[]
  onInputChange: (value: string) => void
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

const subjectColorMap: Record<SubjectType, string> = {
  math: 'bg-brand-500 hover:bg-brand-600',
  other: 'bg-[#4d7f5e] hover:bg-[#3d6e50]',
}

const subjectBadgeMap: Record<SubjectType, string> = {
  math: 'bg-brand-100 text-brand-700',
  other: 'bg-[#dfeecf] text-brand-700',
}

export default function SolverChatView({
  subjectType,
  messages,
  input,
  loading,
  isLoadingMessages,
  currentWaitTime,
  timeoutWarning,
  apiTimeout,
  retryCount,
  presets,
  onInputChange,
  onPresetSelect,
  onSubmit,
  onBack,
  onRetry,
  onClearTimeout,
  onOpenThreads,
  onGoMainPage,
}: SolverChatViewProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading, isLoadingMessages, apiTimeout])

  const sendButtonTone = subjectType ? subjectColorMap[subjectType] : subjectColorMap.math

  return (
    <section className="flex h-full min-h-0 flex-col" data-solver-chat-view>
      <header className="border-b border-brand-100/80 bg-white/78 px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="min-h-11 min-w-11 rounded-full text-brand-700 hover:bg-brand-50"
              title="返回問題編輯"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-brand-100">
                <Image src="/teacher-icon-192x192.png" alt="青椒老師" width={40} height={40} className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <h1 className={`truncate text-lg text-brand-900 ${styles.displayHeading}`}>青椒老師</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs tracking-[0.16em] text-brand-500">SOLVER CHAT</p>
                  {subjectType ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${subjectBadgeMap[subjectType]}`}>
                      {subjectLabelMap[subjectType]}
                    </span>
                  ) : null}
                </div>
              </div>
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

      <div className={`scrollbar-hide ${styles.chatScroller} flex-1 overflow-y-auto px-4 py-4 sm:px-6`}>
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {isLoadingMessages && messages.length === 0 ? (
            <div className="space-y-4 rounded-[1.5rem] border border-brand-100 bg-white/90 p-4 shadow-[0_14px_30px_rgba(66,122,91,0.08)]">
              <div className="h-4 w-32 animate-pulse rounded bg-brand-100" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
              </div>
              <div className="flex items-center gap-2 text-sm text-brand-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                載入聊天記錄中...
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isAssistant = message.role === 'assistant'

                return (
                  <article
                    key={`${message.role}-${index}-${message.timestamp || ''}`}
                    className={isAssistant ? 'flex items-start gap-2' : 'flex items-start justify-end'}
                  >
                    {isAssistant ? (
                      <div className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-brand-100">
                        <Image
                          src="/teacher-icon-192x192.png"
                          alt="青椒老師"
                          width={32}
                          height={32}
                          className="h-full w-full"
                        />
                      </div>
                    ) : null}

                    <div className={isAssistant ? 'max-w-[min(100%,44rem)]' : 'max-w-[min(86vw,28rem)]'}>
                      <div className="mb-1 text-xs text-neutral-500">
                        {isAssistant ? (
                          <>
                            青椒老師 · 剛剛
                            {message.responseTime ? (
                              <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600">{message.responseTime}秒</span>
                            ) : null}
                          </>
                        ) : (
                          'Me · 剛剛'
                        )}
                      </div>

                      {isAssistant ? (
                        <div className="overflow-hidden rounded-[1.35rem] border border-brand-100 bg-white p-4 shadow-[0_12px_30px_rgba(66,122,91,0.06)]">
                          <MarkdownMessage>{message.content || ''}</MarkdownMessage>
                        </div>
                      ) : (
                        <div
                          className={`overflow-hidden rounded-[1.3rem] px-4 py-3 text-white shadow-[0_14px_24px_rgba(66,122,91,0.22)] ${
                            subjectType === 'other' ? 'bg-[#4d7f5e]' : 'bg-brand-500'
                          }`}
                        >
                          {message.imageUrl ? (
                            <button
                              type="button"
                              className="mb-3 w-full"
                              onClick={() => {
                                window.open(message.imageUrl, '_blank')
                              }}
                              title="開啟圖片"
                            >
                              <Image
                                src={message.imageUrl}
                                alt="題目圖片"
                                width={360}
                                height={240}
                                className="h-auto max-h-[220px] w-full rounded-lg object-contain"
                                unoptimized
                              />
                            </button>
                          ) : null}
                          {message.content ? (
                            <p className="break-words text-sm leading-7 sm:text-[15px]">{message.content}</p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </>
          )}

          {loading ? (
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-brand-100">
                <Image src="/teacher-icon-192x192.png" alt="青椒老師" width={32} height={32} className="h-full w-full" />
              </div>
              <div className="max-w-[min(100%,36rem)] rounded-[1.2rem] border border-brand-100 bg-white px-4 py-3 shadow-[0_10px_22px_rgba(66,122,91,0.08)]">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <RefreshCw className="h-4 w-4 animate-spin text-brand-600" />
                  正在思考...
                  {currentWaitTime > 0 ? (
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">{currentWaitTime}秒</span>
                  ) : null}
                </div>
                {timeoutWarning ? <p className="mt-2 text-xs text-orange-600">處理時間較長，請稍候...</p> : null}
              </div>
            </div>
          ) : null}

          {apiTimeout ? (
            <div className="rounded-[1.3rem] border border-orange-200 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,237,213,0.8))] p-4 shadow-[0_12px_26px_rgba(249,115,22,0.12)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900">處理時間過長</p>
                  <p className="mt-1 text-sm leading-6 text-orange-800">系統仍可重試同一個問題，建議再試一次。</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={onRetry}
                      className="min-h-11 rounded-full bg-orange-500 text-white hover:bg-orange-600"
                      disabled={loading}
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      重試{retryCount > 0 ? ` (${retryCount})` : ''}
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
            </div>
          ) : null}

          <div ref={endRef} />
        </div>
      </div>

      <footer className={`border-t border-brand-100/80 bg-white/86 px-3 pt-3 shadow-[0_-12px_32px_rgba(66,122,91,0.08)] sm:px-4 ${styles.stickyComposer}`}>
        <div className="mx-auto w-full max-w-4xl space-y-3">
          <form
            className="flex items-center gap-2 rounded-full border border-brand-100 bg-[#f5f8f2] px-2 py-2"
            onSubmit={async (event) => {
              event.preventDefault()
              await onSubmit(event)
            }}
          >
            <Input
              type="text"
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="輸入訊息..."
              className="h-11 flex-1 border-0 bg-transparent px-2 text-[15px] shadow-none focus-visible:ring-0"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className={`min-h-11 min-w-11 rounded-full p-0 text-white ${sendButtonTone}`}
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

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
        </div>
      </footer>
    </section>
  )
}
