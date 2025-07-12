"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  // 點擊外部區域和按 ESC 鍵關閉選單
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

    // 只在選單打開時添加事件監聽器
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscKey)
    }

    // 清理事件監聽器
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isMenuOpen])

  return (
    <header ref={headerRef} className="bg-white border-b border-neutral-100 py-6 relative">
      <div className="container px-6 mx-auto max-w-6xl">
        {/* 統一排列 - 品牌名稱靠左，選單/按鈕靠右 */}
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 text-xl font-semibold text-gray-900 flex-shrink-0">
            <Image 
              src="/teacher-icon.png" 
              alt="青椒老師家教中心" 
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span>青椒老師家教中心</span>
          </Link>
          
          {/* 桌面版選單 */}
          <nav className="hidden md:block">
            <ul className="flex items-center space-x-8">
              <li><Link href="/tutors" className="text-neutral-600 hover:text-brand-700 transition-colors">家教老師</Link></li>
              <li><Link href="/tutor-cases" className="text-neutral-600 hover:text-brand-700 transition-colors">案件專區</Link></li>
              <li><Link href="/solver" className="text-neutral-600 hover:text-brand-700 transition-colors">AI解題</Link></li>
              <li><Link href="/tutor-registration" className="text-neutral-600 hover:text-brand-700 transition-colors">教師登錄</Link></li>
              <li>
                <Link href="/case-upload" className="bg-brand-500 text-white px-6 py-2 rounded-full hover:bg-brand-600 transition-colors inline-block">
                  找家教
                </Link>
              </li>
            </ul>
          </nav>

          {/* 漢堡選單按鈕 - 只在小螢幕顯示 */}
          <button 
            className="text-neutral-600 md:hidden p-2 flex-shrink-0 transition-transform duration-200"  
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg 
              className={`w-6 h-6 transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : 'rotate-0'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* 手機版選單 */}
        <nav className="md:hidden">
          <div className={`absolute top-full left-0 right-0 bg-white border-t border-neutral-100 shadow-lg z-50 transition-all duration-300 ease-in-out ${
            isMenuOpen 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform -translate-y-4 pointer-events-none'
          }`}>
            <div className={`container px-6 mx-auto py-6 transition-all duration-300 ${
              isMenuOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
            }`}>
              {/* 主要功能區 */}
              <div className={`space-y-1 mb-6 transition-all duration-300 delay-75 ${
                isMenuOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
              }`}>
                <Link href="/case-upload" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between w-full bg-brand-500 text-white px-4 py-3 rounded-xl hover:bg-brand-600 transition-colors">
                  <span className="font-medium">找家教</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* 瀏覽區域 */}
              <div className={`space-y-1 mb-6 transition-all duration-300 delay-100 ${
                isMenuOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
              }`}>
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide px-2 mb-2">瀏覽</div>
                <Link href="/tutor-cases" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between w-full text-neutral-700 hover:text-brand-700 hover:bg-brand-50 px-4 py-3 rounded-lg transition-colors">
                  <span>案件專區</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/tutors" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between w-full text-neutral-700 hover:text-brand-700 hover:bg-brand-50 px-4 py-3 rounded-lg transition-colors">
                  <span>家教老師</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* 工具和註冊 */}
              <div className={`space-y-1 transition-all duration-300 delay-150 ${
                isMenuOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
              }`}>
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide px-2 mb-2">服務</div>
                <Link href="/solver" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between w-full text-neutral-700 hover:text-brand-700 hover:bg-brand-50 px-4 py-3 rounded-lg transition-colors">
                  <span>AI解題</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-brand-400 rounded-full"></div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                <Link href="/tutor-registration" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between w-full text-neutral-700 hover:text-brand-700 hover:bg-brand-50 px-4 py-3 rounded-lg transition-colors">
                  <span>教師登錄</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
