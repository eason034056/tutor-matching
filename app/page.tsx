'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  MapPin,
  MessageSquare,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

import { ScrollAnimationWrapper } from '@/hooks/useScrollAnimation'
import { Button } from '@/components/ui/button'

const logos = [
  '/logo/image1.png',
  '/logo/image2.png',
  '/logo/image3.png',
  '/logo/image4.png',
  '/logo/image5.png',
  '/logo/image6.png',
  '/logo/image7.png',
  '/logo/image8.png',
]

const trustBadges = [
  { icon: GraduationCap, label: '清大 / 交大 / 台大等師資' },
  { icon: ShieldCheck, label: '專人協助配對' },
  { icon: BadgeCheck, label: '免費媒合評估' },
]

const advisoryPoints = [
  '先協助家長整理科目、年級、預算與地點，避免一開始就填太多不必要資訊。',
  '顧問依照學校背景、教學經驗、時段與交通條件先做第一輪篩選。',
  '確認合適人選後再安排聯繫，讓家長不用自己逐一詢問與比較。',
]

const processSteps = [
  {
    icon: FileText,
    title: '告訴我們需求',
    summary: '填寫孩子的科目、年級、預算與上課方式，我們先幫你整理媒合重點。',
    helper: '顧問協助釐清需求',
    outcome: '家長收到需求確認與初步建議',
  },
  {
    icon: Search,
    title: '顧問篩選老師',
    summary: '根據學校背景、教學經驗、地區與時段，從合適名單中先做比對與推薦。',
    helper: '顧問代為比對與聯繫',
    outcome: '提供符合條件的老師方向與安排方式',
  },
  {
    icon: MessageSquare,
    title: '安排聯繫與開始上課',
    summary: '確認雙方條件後安排聯繫，協助家長更順利銜接試教或正式上課。',
    helper: '顧問陪伴到媒合落地',
    outcome: '更安心地開始一對一家教',
  },
]

const credentialCards = [
  {
    title: '師資來源看得見',
    description: '平台以清大、交大、台大與其他國立大學背景老師為核心，先看學科基礎，再看教學表達與配合度。',
    points: ['學校與科目背景相符', '教學經驗與溝通能力並重', '依學生程度與目標調整配對'],
  },
  {
    title: '不是只有列名單',
    description: '我們不是把老師資料直接丟給家長，而是先代做一次篩選與整理，讓媒合更省時間。',
    points: ['先確認上課地區與時段', '依家長預算縮小選項', '媒合前再確認老師意願'],
  },
]

const subjectTags = [
  '國小伴讀',
  '國中數學',
  '國中英文',
  '高中數學',
  '高中英文',
  '自然理化',
  '學測複習',
  '會考衝刺',
]

const supportFaq = [
  {
    question: '誰會跟我聯絡？',
    answer: '會由青椒老師團隊的顧問先與你確認需求，協助整理孩子目前的狀況、希望的上課方式與老師條件。',
  },
  {
    question: '通常多久會開始媒合？',
    answer: '收到需求後會先進行初步確認，再依照地區、科目與時段安排媒合。可媒合條件越清楚，速度通常越快。',
  },
  {
    question: '如果我不確定該怎麼挑老師？',
    answer: '這就是顧問存在的目的。我們會先幫你判斷適合的學校背景、教學風格與媒合條件，不需要家長自己從零比較。',
  },
  {
    question: '媒合需要先付費嗎？',
    answer: '不需要，整個媒合與諮詢流程都完全免費，家長不用支付任何費用即可使用服務。',
  },
]

const teacherBenefits = [
  '查看申請條件與審核流程',
  '瞭解案件媒合方式與接案節奏',
  '完成登錄後由平台安排合適案件',
]

const heroMetrics = [
  { label: '媒合方式', value: '顧問陪跑' },
  { label: '師資重點', value: '名校背景' },
  { label: '開始門檻', value: '先看流程' },
]

const sectionTitleClass = 'font-display text-3xl leading-tight text-brand-900 md:text-5xl'

const TrustBadge = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
  <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-200/70 bg-white/90 px-4 py-2 text-sm font-medium text-brand-800 shadow-[0_10px_30px_rgba(66,122,91,0.08)] backdrop-blur">
    <Icon className="h-4 w-4 text-brand-600" />
    <span>{label}</span>
  </div>
)

const ProcessCard = ({
  icon: Icon,
  index,
  title,
  summary,
  helper,
  outcome,
}: {
  icon: LucideIcon
  index: number
  title: string
  summary: string
  helper: string
  outcome: string
}) => (
  <div className="relative rounded-[2rem] border border-brand-100 bg-white px-6 py-7 shadow-[0_24px_80px_rgba(67,102,78,0.08)]">
    <div className="mb-5 flex items-center justify-between">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-semibold tracking-[0.24em] text-brand-300">0{index}</span>
    </div>
    <h3 className="mb-3 text-xl font-semibold text-brand-900">{title}</h3>
    <p className="mb-5 text-sm leading-7 text-neutral-600">{summary}</p>
    <div className="space-y-3 rounded-[1.5rem] bg-[#f8f5ea] p-4 text-sm text-neutral-700">
      <div className="flex gap-3">
        <Users className="mt-0.5 h-4 w-4 flex-none text-brand-600" />
        <span>{helper}</span>
      </div>
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-600" />
        <span>{outcome}</span>
      </div>
    </div>
  </div>
)

const FaqItem = ({ question, answer }: { question: string; answer: string }) => (
  <details className="group rounded-[1.75rem] border border-brand-100 bg-white px-5 py-4 shadow-[0_12px_40px_rgba(67,102,78,0.06)]">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-brand-900 [&::-webkit-details-marker]:hidden">
      <span>{question}</span>
      <ChevronRight className="h-5 w-5 flex-none text-brand-500 transition-transform duration-300 group-open:rotate-90" />
    </summary>
    <p className="pt-4 text-sm leading-7 text-neutral-600">{answer}</p>
  </details>
)

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-[#f7f3e8] text-neutral-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(180,205,147,0.46),_transparent_48%),radial-gradient(circle_at_top_right,_rgba(66,122,91,0.18),_transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent_24%,transparent_76%,rgba(255,255,255,0.18))]" />

      <section className="relative px-4 pb-6 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_22rem] lg:items-stretch lg:gap-8">
            <ScrollAnimationWrapper className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,250,242,0.9))] p-6 shadow-[0_30px_90px_rgba(67,102,78,0.12)] md:p-8 lg:h-full lg:p-10" duration={900}>
              <div className="flex h-full flex-col">
                <div className="mb-5 inline-flex w-auto max-w-max items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-4 py-2 text-xs font-semibold tracking-[0.28em] text-brand-700">
                  <Sparkles className="h-4 w-4" />
                  專業家教媒合
                </div>
                <h1 className="font-display max-w-3xl text-[2.35rem] leading-[1.05] text-brand-900 sm:text-5xl lg:text-[4.0rem]">
                  先安心，再幫孩子找到適合的老師
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
                  想找優質又安心的家教？我們嚴選名校師資，媒合顧問親自協助，服務流程透明，保障每位家長的需求。讓您不用花時間篩選、不必擔心踩雷，我們幫您把關每一個細節，最快速度找到最適合孩子的專業老師！
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {trustBadges.map((badge) => (
                    <TrustBadge key={badge.label} {...badge} />
                  ))}
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    asChild
                    size="lg"
                    className="min-h-12 rounded-full bg-brand-500 px-6 text-base font-semibold text-white shadow-[0_18px_45px_rgba(66,122,91,0.28)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-brand-600"
                  >
                    <a href="#process">
                      先看媒合流程
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="min-h-12 rounded-full border-brand-300 bg-white/80 px-6 text-base font-semibold text-brand-800 shadow-[0_12px_32px_rgba(66,122,91,0.08)] hover:bg-brand-50"
                  >
                    <Link href="/case-upload">
                      直接填需求
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:mt-auto lg:pt-8">
                  {heroMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-[1.5rem] border border-brand-100 bg-white/80 px-4 py-4 shadow-[0_12px_32px_rgba(66,122,91,0.06)]">
                      <div className="text-xs uppercase tracking-[0.24em] text-brand-400">{metric.label}</div>
                      <div className="mt-2 text-lg font-semibold text-brand-900">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollAnimationWrapper>

            <ScrollAnimationWrapper className="rounded-[2rem] border border-brand-100 bg-[#fffdf8]/95 p-5 shadow-[0_28px_70px_rgba(67,102,78,0.1)] backdrop-blur md:p-6 lg:h-full" delay={180} duration={900}>
              <div className="grid h-full gap-6 lg:grid-rows-[auto_1fr]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
                    <Image src="/teacher-icon-512x512.png" alt="青椒老師家教中心" width={32} height={32} className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-700">媒合顧問會先幫你整理重點</p>
                    <p className="text-sm text-neutral-500">不是丟一串老師名單讓家長自己挑</p>
                  </div>
                </div>

                <div className="flex h-full flex-col justify-between gap-6">
                  <div className="space-y-4">
                    {advisoryPoints.map((point) => (
                      <div key={point} className="flex gap-3 rounded-[1.35rem] bg-[#f5f1e4] px-4 py-4 text-sm leading-7 text-neutral-700">
                        <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-brand-600" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.5rem] border border-brand-100 bg-white p-5">
                    <div className="flex items-center gap-3 text-sm font-semibold text-brand-700">
                      <Clock3 className="h-4 w-4" />
                      家長最常先看的 3 件事
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-neutral-600">
                      <div className="flex items-center justify-between gap-3 border-b border-brand-100 pb-3">
                        <span>師資背景是否符合需求</span>
                        <span className="font-semibold text-brand-800">先篩選</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-b border-brand-100 pb-3">
                        <span>流程是否清楚、有沒有人協助</span>
                        <span className="font-semibold text-brand-800">會說明</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>還沒準備好時可先看工具</span>
                        <span className="font-semibold text-brand-800">AI 解題</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimationWrapper>
          </div>

          <ScrollAnimationWrapper className="mt-5" delay={240} duration={900}>
            <div className="rounded-[2rem] border border-brand-100 bg-[linear-gradient(135deg,rgba(242,247,238,0.96),rgba(255,255,255,0.92))] p-6 shadow-[0_24px_70px_rgba(67,102,78,0.08)] md:p-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold tracking-[0.28em] text-brand-500">TEACHER PATH</p>
                  <h2 className="mt-2 font-display text-2xl text-brand-900 md:text-3xl">想開始接家教案件？查看流程與申請條件</h2>
                  <p className="mt-3 text-sm leading-7 text-neutral-600 md:text-base">
                    首頁主線先服務家長，但老師入口會保留在第一段。你可以先看平台審核方式、案件節奏與登錄條件，再決定是否加入。
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/90 p-4 shadow-[0_18px_40px_rgba(67,102,78,0.06)] md:max-w-sm">
                  <div className="space-y-3 text-sm text-neutral-700">
                    {teacherBenefits.map((benefit) => (
                      <div key={benefit} className="flex gap-3">
                        <BadgeCheck className="mt-0.5 h-4 w-4 flex-none text-brand-600" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <Button asChild variant="outline" className="mt-5 min-h-11 w-full rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50">
                    <Link href="/tutor-registration">
                      前往教師登錄
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </section>

      <ScrollAnimationWrapper>
        <section id="process" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold tracking-[0.28em] text-brand-500">PROCESS</p>
              <h2 className={`${sectionTitleClass} mt-3`}>先看懂流程，再決定要不要填需求</h2>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-5">
              {processSteps.map((step, index) => (
                <ScrollAnimationWrapper key={step.title} delay={180 + index * 120} duration={900}>
                  <ProcessCard index={index + 1} {...step} />
                </ScrollAnimationWrapper>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 rounded-[2rem] bg-brand-900 px-6 py-7 text-white shadow-[0_28px_80px_rgba(31,58,45,0.22)] md:flex-row md:items-center md:justify-between md:px-8">
              <div>
                <p className="text-sm font-semibold tracking-[0.28em] text-brand-200">READY TO START</p>
                <h3 className="mt-2 font-display text-2xl md:text-3xl">流程清楚了，現在就可以填寫需求表</h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-100 md:text-base">
                  先告訴我們孩子目前的學習狀況與家長希望，我們再依條件協助安排適合的老師方向。
                </p>
              </div>
              <Button asChild size="lg" className="min-h-12 rounded-full bg-[#dfeecf] px-6 text-base font-semibold text-brand-900 hover:bg-[#cfe5b8]">
                <Link href="/case-upload">
                  填寫需求表
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </ScrollAnimationWrapper>

      <ScrollAnimationWrapper>
        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl rounded-[2.25rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,249,242,0.92))] p-6 shadow-[0_32px_100px_rgba(67,102,78,0.08)] md:p-8 lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_0.95fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold tracking-[0.28em] text-brand-500">CREDENTIALS</p>
                <h2 className={`${sectionTitleClass} mt-3`}>值得信賴的師資陣容</h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-600">
                  每一位教學夥伴都經過嚴格篩選，不僅具備專業學歷，更重視教學經驗與溝通能力。我們真誠傾聽每個孩子的需求，並且定期追蹤上課情形，確保每位老師都能成為家長與學生信賴的夥伴。選擇我們，就是選擇安心與責任感兼具的師資團隊。
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {credentialCards.map((card) => (
                    <div key={card.title} className="rounded-[1.75rem] border border-brand-100 bg-[#fffdf8] p-5 shadow-[0_18px_45px_rgba(67,102,78,0.05)]">
                      <h3 className="text-xl font-semibold text-brand-900">{card.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-neutral-600">{card.description}</p>
                      <div className="mt-4 space-y-3 text-sm text-neutral-700">
                        {card.points.map((point) => (
                          <div key={point} className="flex gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-600" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[1.85rem] border border-brand-100 bg-white p-5 shadow-[0_18px_50px_rgba(67,102,78,0.06)]">
                  <div className="flex items-center gap-3 text-sm font-semibold text-brand-700">
                    <GraduationCap className="h-4 w-4" />
                    常見師資背景來源
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {logos.map((logo, index) => (
                      <div key={logo} className="flex h-20 items-center justify-center rounded-[1.2rem] border border-brand-100 bg-[#f8f5ea] p-3">
                        <Image
                          src={logo}
                          alt={`合作師資學校 ${index + 1}`}
                          width={110}
                          height={44}
                          className="h-10 w-auto object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.85rem] border border-brand-100 bg-white p-5 shadow-[0_18px_50px_rgba(67,102,78,0.06)]">
                  <div className="flex items-center gap-3 text-sm font-semibold text-brand-700">
                    <BookOpen className="h-4 w-4" />
                    常見媒合需求
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {subjectTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 rounded-[1.4rem] bg-[#f8f5ea] p-4 text-sm leading-7 text-neutral-700">
                    媒合時會一起看科目能力、教學表達、可配合時段與地區，讓推薦更接近家長的真實需求。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollAnimationWrapper>

      <ScrollAnimationWrapper>
        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="rounded-[2rem] bg-brand-900 p-6 text-white shadow-[0_30px_90px_rgba(31,58,45,0.2)] md:p-8">
              <p className="text-sm font-semibold tracking-[0.28em] text-brand-200">GUIDED SUPPORT</p>
              <h2 className="mt-3 font-display text-3xl leading-tight md:text-5xl">有人協助，才是家長真正想要的安心感</h2>
              <p className="mt-4 text-sm leading-8 text-brand-100 md:text-base">
                找家教不安心？讓專業顧問全程協助您！孩子的獨特需求、學習困難、家長的期望，我們都細心聆聽。從理解狀況、條件整理到推薦合適老師，一對一陪伴家長做出最適合孩子的選擇。您只需要把需求放心交給我們，其他都交由專人打點，把最適合的家教帶到您身邊。
              </p>

              <div className="mt-6 space-y-4 rounded-[1.75rem] bg-white/8 p-5 text-sm leading-7 text-brand-50 backdrop-blur">
                <div className="flex gap-3">
                  <PhoneCall className="mt-1 h-4 w-4 flex-none text-brand-200" />
                  <span>顧問先聯絡確認孩子狀況與家長期待，避免一開始就選錯方向。</span>
                </div>
                <div className="flex gap-3">
                  <MapPin className="mt-1 h-4 w-4 flex-none text-brand-200" />
                  <span>上課地點、線上或實體、每週時段等實際條件，會在媒合前先幫你整理。</span>
                </div>
                <div className="flex gap-3">
                  <Users className="mt-1 h-4 w-4 flex-none text-brand-200" />
                  <span>你看到的不是原始名單，而是更接近需求、可開始討論的老師方向。</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {supportFaq.map((item) => (
                <FaqItem key={item.question} {...item} />
              ))}
            </div>
          </div>
        </section>
      </ScrollAnimationWrapper>

      <ScrollAnimationWrapper>
        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-brand-100 bg-[linear-gradient(135deg,rgba(237,244,228,0.95),rgba(255,255,255,0.9))] p-6 shadow-[0_26px_90px_rgba(67,102,78,0.08)] md:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold tracking-[0.28em] text-brand-500">AI STUDY TOOL</p>
                <h2 className="mt-3 font-display text-3xl text-brand-900 md:text-4xl">還沒準備找老師？先用 AI 解題看看</h2>
                <p className="mt-4 text-base leading-8 text-neutral-600">
                  不確定孩子卡在哪裡、還沒準備找家教？讓青椒老師的 AI 幫你解題，快速搞懂孩子遇到的難題。先有解決方法，家長才能更清楚下一步需要什麼協助。
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-brand-100 bg-white/95 p-5 shadow-[0_18px_50px_rgba(67,102,78,0.06)]">
                <div className="flex items-start gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-brand-900">青椒老師解題 AI</h3>
                    <p className="mt-2 text-sm leading-7 text-neutral-600">
                      孩子在學習上遇到瓶頸，讓 AI 高手幫你迅速解題、解析每一步。家長能親自體驗詳細解說，立刻知道青椒老師如何協助孩子突破難題，先感受到專業與用心，才放心決定下一步。
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-5 min-h-12 w-full rounded-full border-brand-300 bg-white text-brand-800 hover:bg-brand-50">
                  <Link href="/solver">
                    前往 AI 解題
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </ScrollAnimationWrapper>

      <ScrollAnimationWrapper>
        <section className="px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="mx-auto max-w-6xl rounded-[2.2rem] bg-[linear-gradient(145deg,#234430,#427a5b)] px-6 py-8 text-white shadow-[0_40px_120px_rgba(31,58,45,0.22)] md:px-8 md:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold tracking-[0.28em] text-brand-100">FINAL STEP</p>
                <h2 className="mt-3 font-display text-3xl leading-tight md:text-5xl">看完流程後，現在可以安心開始填需求</h2>
                <p className="mt-4 text-sm leading-8 text-brand-100 md:text-base">
                  你不需要先自己把所有老師都看過一輪。先告訴我們孩子的情況，剩下的媒合整理工作交給顧問協助完成。
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[16rem]">
                <Button asChild size="lg" className="min-h-12 rounded-full bg-[#e3f2d2] text-base font-semibold text-brand-900 hover:bg-[#d4e9bc]">
                  <Link href="/case-upload">
                    立即填需求
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Link href="/tutor-registration" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white/88 transition-colors hover:bg-white/10">
                  老師想加入平台？前往教師登錄
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ScrollAnimationWrapper>
    </div>
  )
}
