"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Menu, X } from 'lucide-react'

const primaryMobileLinks = [
  { href: '/case-upload', label: '填需求', description: '家長入口' },
  { href: '/tutor-registration', label: '教師登錄', description: '老師入口' },
]

const secondaryMobileLinks = [
  { href: '/tutors', label: '家教老師' },
  { href: '/tutor-cases', label: '案件專區' },
  { href: '/solver', label: 'AI解題' },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isMenuOpen])

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-brand-100/70 bg-[#fbfaf4]/90 backdrop-blur-xl">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex min-h-[76px] items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-1 text-brand-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl">
              <Image
                src="/teacher-icon-512x512.png"
                alt="青椒老師家教中心"
                width={30}
                height={30}
                className="h-8 w-8"
              />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold md:text-lg">青椒老師家教中心</div>
              <div className="hidden text-xs tracking-[0.18em] text-brand-500 sm:block">TUTOR MATCHING CONSULTING</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link href="/tutors" className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-700">家教老師</Link>
            <Link href="/tutor-cases" className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-700">案件專區</Link>
            <Link href="/solver" className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-700">AI解題</Link>
            <Link href="/tutor-registration" className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-700">教師登錄</Link>
            <Link href="/case-upload" className="inline-flex min-h-11 items-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(66,122,91,0.2)] transition-colors hover:bg-brand-600">
              填需求
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <Link href="/case-upload" className="inline-flex min-h-11 items-center rounded-full border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-800 shadow-[0_10px_24px_rgba(66,122,91,0.08)] transition-colors hover:bg-brand-50">
              填需求
            </Link>
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? '關閉選單' : '開啟選單'}
              onClick={() => setIsMenuOpen((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-800 shadow-[0_10px_24px_rgba(66,122,91,0.08)] transition-colors hover:bg-brand-50"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav className="md:hidden">
          <div
            className={`overflow-hidden border-t border-brand-100/70 transition-all duration-300 ${
              isMenuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-5 px-1 py-5">
              <div className="grid gap-3">
                {primaryMobileLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between rounded-[1.35rem] border border-brand-100 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(66,122,91,0.06)]"
                  >
                    <div>
                      <div className="text-base font-semibold text-brand-900">{link.label}</div>
                      <div className="mt-1 text-sm text-neutral-500">{link.description}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-brand-500" />
                  </Link>
                ))}
              </div>

              <div className="rounded-[1.35rem] border border-brand-100 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(66,122,91,0.06)]">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">其他</div>
                <div className="space-y-1">
                  {secondaryMobileLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
