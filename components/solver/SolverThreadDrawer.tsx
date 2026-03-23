'use client'

import Image from 'next/image'
import { Clock, Home, Image as ImageIcon, Menu, MessageSquare, Plus, RefreshCw, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChatThread } from '@/lib/types'
import styles from '@/components/solver/solver.module.css'

interface BaseProps {
  threads: ChatThread[]
  currentThreadId: string | null
  loadingThreadId: string | null
  isLoadingMessages: boolean
  onLoadThread: (threadId: string) => void
  onStartNewThread: () => void
  onGoMainPage: () => void
  onClose: () => void
  formatTime: (timestamp: number | Date) => string
  mode: 'mobile' | 'desktop'
}

interface SolverThreadDrawerProps extends Omit<BaseProps, 'mode'> {
  open: boolean
}

function ThreadRail({
  threads,
  currentThreadId,
  loadingThreadId,
  isLoadingMessages,
  onLoadThread,
  onStartNewThread,
  onGoMainPage,
  onClose,
  formatTime,
  mode,
}: BaseProps) {
  const isMobile = mode === 'mobile'

  return (
    <div className="flex h-full flex-col" data-solver-thread-rail={mode}>
      <div className="border-b border-brand-100/80 px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 shadow-[0_8px_22px_rgba(66,122,91,0.12)]">
              <Image src="/teacher-icon-192x192.png" alt="AI助手" width={34} height={34} className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-900">解題助手</p>
              <p className="text-xs tracking-[0.16em] text-brand-500">AI THREADS</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 min-w-11 rounded-full text-brand-700 hover:bg-brand-50"
              onClick={onGoMainPage}
              title="回到主站"
            >
              <Home className="h-4 w-4" />
            </Button>
            {isMobile ? (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 min-w-11 rounded-full text-brand-700 hover:bg-brand-50"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <Button
          onClick={onStartNewThread}
          className="min-h-11 w-full rounded-full bg-brand-500 text-white shadow-[0_14px_30px_rgba(66,122,91,0.2)] hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          新對話
        </Button>
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto px-2 py-3">
        {threads.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-white/80 px-4 py-8 text-center text-neutral-600">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-brand-200" />
            <p className="text-sm">還沒有對話記錄</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {threads.map((thread) => {
              const isLoading = loadingThreadId === thread.id
              const isCurrentThread = currentThreadId === thread.id
              const isDisabled = isLoadingMessages && !isLoading

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      onLoadThread(thread.id)
                    }
                  }}
                  className={cn(
                    'group relative w-full overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all duration-300',
                    isCurrentThread
                      ? 'border-brand-300 bg-brand-50/90 shadow-[0_12px_24px_rgba(66,122,91,0.12)]'
                      : 'border-transparent bg-white/80 hover:border-brand-100 hover:bg-white',
                    isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    isLoading ? 'ring-1 ring-brand-200' : ''
                  )}
                >
                  {isLoading ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-[1px]">
                      <div className="flex items-center gap-2 text-xs font-medium text-brand-700">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        載入中...
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        thread.hasImage ? 'bg-brand-100 text-brand-700' : 'bg-neutral-100 text-neutral-500'
                      )}
                    >
                      {thread.hasImage ? <ImageIcon className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    </div>
                      <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-800">{thread.title || '新對話'}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="truncate">{formatTime(thread.lastUpdated)}</span>
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function SolverThreadRail(props: Omit<BaseProps, 'mode'>) {
  return (
    <aside className={cn('h-full border-r border-brand-100/80', styles.drawerPanel)}>
      <ThreadRail {...props} mode="desktop" />
    </aside>
  )
}

export default function SolverThreadDrawer({ open, ...props }: SolverThreadDrawerProps) {
  return (
    <div
      className={cn('fixed inset-0 z-40 md:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}
      data-solver-mobile-drawer
    >
      <button
        type="button"
        aria-label="關閉歷史抽屜"
        className={cn(
          'absolute inset-0 bg-neutral-900/38 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={props.onClose}
      />
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-[86vw] max-w-[340px] border-r border-brand-100 shadow-[0_30px_60px_rgba(31,58,45,0.22)] transition-transform duration-300 ease-out',
          styles.drawerPanel,
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ThreadRail {...props} mode="mobile" />
      </div>
    </div>
  )
}

export function MobileThreadToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="min-h-11 min-w-11 rounded-full text-brand-700 hover:bg-brand-50 md:hidden"
      onClick={onClick}
      title="打開對話紀錄"
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
}
