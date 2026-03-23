'use client'

import { Camera, Home, MessageSquare, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { SubjectType } from '@/components/solver/types'
import { MobileThreadToggle } from '@/components/solver/SolverThreadDrawer'
import styles from '@/components/solver/solver.module.css'

interface SolverQuickStartProps {
  threadsCount: number
  onOpenThreads: () => void
  onGoMainPage: () => void
  onCameraPick: (subject: SubjectType) => void
  onUploadPick: (subject: SubjectType) => void
}

const cards: Array<{
  subject: SubjectType
  title: string
  description: string
  symbol: string
  iconBg: string
  iconText: string
  primaryButton: string
  secondaryButton: string
}> = [
  {
    subject: 'math',
    title: '數理科目',
    description: '數學、物理、化學',
    symbol: '∑',
    iconBg: 'bg-brand-100',
    iconText: 'text-brand-700',
    primaryButton: 'bg-brand-500 hover:bg-brand-600',
    secondaryButton: 'bg-brand-600 hover:bg-brand-700',
  },
  {
    subject: 'other',
    title: '其他科目',
    description: '國文、英文、生物、地理、公民等',
    symbol: '語',
    iconBg: 'bg-[#dfeecf]',
    iconText: 'text-brand-700',
    primaryButton: 'bg-[#518663] hover:bg-[#3f7353]',
    secondaryButton: 'bg-[#3f7353] hover:bg-[#2d5d42]',
  },
]

export default function SolverQuickStart({
  threadsCount,
  onOpenThreads,
  onGoMainPage,
  onCameraPick,
  onUploadPick,
}: SolverQuickStartProps) {
  return (
    <section className="flex h-full min-h-0 flex-col" data-solver-quickstart>
      <div className="flex items-center justify-between border-b border-brand-100/80 bg-white/70 px-4 py-3 backdrop-blur md:hidden">
        <MobileThreadToggle onClick={onOpenThreads} />
        <p className="text-sm font-semibold tracking-[0.2em] text-brand-600">AI SOLVER</p>
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

      <div className="scrollbar-hide flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <div className="rounded-[1.9rem] border border-white/80 bg-[linear-gradient(150deg,rgba(255,255,255,0.95),rgba(245,250,242,0.9))] p-6 shadow-[0_26px_60px_rgba(66,122,91,0.12)] sm:p-7">
            <p className="text-xs font-semibold tracking-[0.3em] text-brand-500">MOBILE FIRST FLOW</p>
            <h1 className={`mt-4 text-[2rem] leading-[1.08] text-brand-900 sm:text-[2.45rem] ${styles.displayHeading}`}>
              先拍題目，再問重點，
              <br />
              快速拿到可用的解題路徑
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
              選擇科目後直接拍照或上傳，青椒老師會整理關鍵步驟與觀念。
            </p>

            {threadsCount > 0 ? (
              <button
                type="button"
                onClick={onOpenThreads}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow-[0_10px_24px_rgba(66,122,91,0.08)] transition-colors hover:bg-brand-50"
              >
                <MessageSquare className="h-4 w-4" />
                查看 {threadsCount} 筆歷史對話
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <article
                key={card.subject}
                className="rounded-[1.7rem] border border-brand-100 bg-white/90 p-4 shadow-[0_18px_40px_rgba(66,122,91,0.1)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl font-semibold ${card.iconBg} ${card.iconText}`}
                  >
                    {card.symbol}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-neutral-800">{card.title}</h2>
                    <p className="text-xs text-neutral-500">{card.description}</p>
                  </div>
                </div>
                <div className="grid gap-2.5">
                  <Button
                    onClick={() => onCameraPick(card.subject)}
                    className={`min-h-11 rounded-xl text-white ${card.primaryButton}`}
                  >
                    <Camera className="h-4 w-4" />
                    拍照解題
                  </Button>
                  <Button
                    onClick={() => onUploadPick(card.subject)}
                    className={`min-h-11 rounded-xl text-white ${card.secondaryButton}`}
                  >
                    <Upload className="h-4 w-4" />
                    上傳圖片
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-brand-100/80 bg-white/85 px-4 py-4 text-sm text-neutral-600 shadow-[0_14px_30px_rgba(66,122,91,0.07)]">
            <p className="mb-2 text-xs font-semibold tracking-[0.22em] text-brand-500">使用提醒</p>
            <ul className="space-y-1.5 leading-6">
              <li>• 題目請盡量拍清楚且完整，公式與選項都要入鏡。</li>
              <li>• 可先用預設問題快速送出，再透過追問拿到更深入解釋。</li>
              <li>• 若遇到較複雜題型，系統可能需要較長處理時間。</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
