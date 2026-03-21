import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Sparkles } from 'lucide-react'

import CaseUploadForm from '@/components/case-upload-form'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '填寫需求 | 青椒老師家教中心 | 家長媒合登錄',
  description: '用 mobile-first 的需求表單快速整理孩子的科目、地址、時段與預算，顧問會先確認需求，再安排後續媒合與補件流程。',
  keywords: ['家教需求', '找家教', '家長登錄', '家教媒合', '填寫需求', '青椒老師'],
}

const trustPoints = ['三步完成需求登錄', '青椒老師會整理需求重點', '輕鬆找到最合適的家教老師']

export default function CaseUploadPage() {
  return (
    <div className="relative overflow-hidden bg-[#f7f3e8] text-neutral-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top_left,_rgba(180,205,147,0.44),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(66,122,91,0.18),_transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.36),transparent_24%,transparent_78%,rgba(255,255,255,0.2))]" />

      <section className="relative px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,250,242,0.92))] p-6 shadow-[0_30px_90px_rgba(67,102,78,0.12)] md:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-4 py-2 text-xs font-semibold tracking-[0.28em] text-brand-700">
              <Sparkles className="h-4 w-4" />
              FAMILY BRIEFING
            </div>
            <h1 className="mt-5 font-display text-[2.2rem] leading-[1.04] text-brand-900 sm:text-5xl lg:text-[3.65rem]">
              讓我們聆聽您的需求，為孩子找到最適合的家教
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              您只需簡單填寫需求，專業顧問會貼心協助您篩選與安排老師，確保每一步都為孩子量身打造、安心無憂。省時省力，讓您輕鬆陪伴孩子邁向學習新階段！
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {trustPoints.map((point) => (
                <div key={point} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-200/70 bg-white/90 px-4 py-2 text-sm font-medium text-brand-800 shadow-[0_10px_30px_rgba(66,122,91,0.08)] backdrop-blur">
                  <BadgeCheck className="h-4 w-4 text-brand-600" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.1rem] border border-brand-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,249,242,0.92))] p-5 shadow-[0_32px_100px_rgba(67,102,78,0.08)] md:p-6 lg:p-8">
            <CaseUploadForm />
          </div>

          <div className="rounded-[2rem] bg-brand-900 px-6 py-7 text-white shadow-[0_28px_80px_rgba(31,58,45,0.22)] md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold tracking-[0.28em] text-brand-200">NEED HELP FIRST?</p>
                <h2 className="mt-3 font-display text-2xl md:text-3xl">還沒準備好直接填？先看流程或先問顧問也可以</h2>
                <p className="mt-3 text-sm leading-7 text-brand-100 md:text-base">如果你想先理解媒合怎麼進行、顧問會怎麼協助，也可以回首頁看完整流程，或直接透過 LINE 先聊。</p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                <Button asChild size="lg" className="min-h-12 rounded-full bg-[#dfeecf] px-6 text-base font-semibold text-brand-900 hover:bg-[#cfe5b8]">
                  <Link href="/">
                    回首頁看流程
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <a href="https://line.me/ti/p/~home-tutor-tw" target="_blank" rel="noopener noreferrer" className="inline-flex">
                  <Button size="lg" variant="outline" className="min-h-12 rounded-full border-white/20 bg-transparent px-6 text-base font-semibold text-white hover:bg-white/10">
                    直接問顧問
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
