import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

const parentLinks = [
  { href: '/case-upload', label: '家長需求登錄' },
  { href: '/process', label: '媒合流程說明' },
  { href: '/pricing', label: '費用參考' },
]

const platformLinks = [
  { href: '/tutor-registration', label: '教師登錄' },
  { href: '/tutor-cases', label: '案件專區' },
  { href: '/terms', label: '服務條款' },
]

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200/90 bg-[#f7f3e8] px-4 py-8 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.8fr))] md:items-start md:gap-10">
          <div>
            <h2 className="max-w-xl font-display text-2xl leading-tight text-brand-900 md:text-[2rem]">
              專人把關‧優質師資‧安心配對
            </h2>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="min-h-11 rounded-full bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                <Link href="/case-upload">
                  家長需求登錄
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-11 rounded-full border-brand-300 bg-white/80 px-5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
              >
                <Link href="/tutor-registration">
                  教師申請入口
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <nav className="md:border-l md:border-neutral-200/80 md:pl-8">
            <div className="text-xs font-semibold tracking-[0.22em] text-brand-500">家長常用</div>
            <ul className="mt-3 space-y-2.5">
              {parentLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-3 text-sm text-neutral-700 transition-colors hover:text-brand-800"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-brand-500 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:border-l md:border-neutral-200/80 md:pl-8">
            <div className="text-xs font-semibold tracking-[0.22em] text-brand-500">老師與平台</div>
            <ul className="mt-3 space-y-2.5">
              {platformLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-3 text-sm text-neutral-700 transition-colors hover:text-brand-800"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-brand-500 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-neutral-200/80 pt-6 text-sm text-neutral-600 md:flex-row md:items-center md:justify-between">
          <p>© 2026 青椒老師家教中心. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/notice" className="transition-colors hover:text-brand-700">
              注意事項
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
