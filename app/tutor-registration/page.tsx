import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BadgeCheck, MessageCircle, Sparkles } from "lucide-react"

import TutorRegistrationForm from "@/components/tutor-registration-form"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "家教老師註冊立即接案 | 青椒老師家教中心 | 最專業最快速的家教媒合平台",
  description:
    "老師註冊採 mobile-first 三步流程。先填基本與教學背景，再上傳學生證、身分證完成送審。",
  keywords: ["家教註冊", "家教兼職", "教師登錄", "家教老師", "青椒老師"],
}

const trustPoints = ["三步完成老師登錄", "證件選檔即上傳", "1-2 個工作天完成審核"]

export default function TutorRegistrationPage() {
  return (
    <div className="relative overflow-hidden bg-[#f7f3e8] text-neutral-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top_left,_rgba(180,205,147,0.44),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(66,122,91,0.18),_transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.36),transparent_24%,transparent_78%,rgba(255,255,255,0.2))]" />

      <section className="relative px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,250,242,0.92))] p-6 shadow-[0_30px_90px_rgba(67,102,78,0.12)] md:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-4 py-2 text-xs font-semibold tracking-[0.28em] text-brand-700">
              <Sparkles className="h-4 w-4" />
              TEACHER ONBOARDING
            </div>
            <h1 className="mt-5 font-display text-[2.2rem] leading-[1.04] text-brand-900 sm:text-5xl lg:text-[3.65rem]">
              完成教師登錄，開始接到適合你的家教案件
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              這份表單為 mobile-first 設計，先填基本資料與教學背景，再上傳學生證與身分證。每張證件選檔後會立即上傳，失敗可單張重試。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-200/70 bg-white/90 px-4 py-2 text-sm font-medium text-brand-800 shadow-[0_10px_30px_rgba(66,122,91,0.08)] backdrop-blur"
                >
                  <BadgeCheck className="h-4 w-4 text-brand-600" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.1rem] border border-brand-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,249,242,0.92))] p-5 shadow-[0_32px_100px_rgba(67,102,78,0.08)] md:p-6 lg:p-8">
            <TutorRegistrationForm />
          </div>

          <div className="rounded-[2rem] bg-brand-900 px-6 py-7 text-white shadow-[0_28px_80px_rgba(31,58,45,0.22)] md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold tracking-[0.28em] text-brand-200">NEED HELP FIRST?</p>
                <h2 className="mt-3 font-display text-2xl md:text-3xl">想先了解流程？可以先看完整說明或直接問顧問</h2>
                <p className="mt-3 text-sm leading-7 text-brand-100 md:text-base">
                  如果你還不確定怎麼填，先看流程頁會更清楚，也可以直接透過 LINE 跟顧問確認。
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="min-h-12 rounded-full bg-[#dfeecf] px-6 text-base font-semibold text-brand-900 hover:bg-[#cfe5b8]"
                >
                  <Link href="/process">
                    查看老師流程
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <a href="https://line.me/ti/p/~home-tutor-tw" target="_blank" rel="noopener noreferrer" className="inline-flex">
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-h-12 rounded-full border-white/20 bg-transparent px-6 text-base font-semibold text-white hover:bg-white/10"
                  >
                    <MessageCircle className="h-4 w-4" />
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
