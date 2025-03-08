"use client"

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white text-primary-foreground p-4 mt-4 ">
      <div className="container px-4 mx-auto flex flex-wrap justify-between items-center max-w-7xl">
        <Link href="/" className="text-2xl text-[#0F1035] font-bold min-w-[140px]">青椒家教中心</Link>
        
        {/* 漢堡選單按鈕 - 只在小螢幕顯示 */}
        <button 
          className="text-[#233B6E] md:hidden p-2"  
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <nav className={`${isMenuOpen ? 'block' : 'hidden'} w-full md:block md:w-auto`}>
          <ul className="flex flex-col md:flex-row px-4 md:px-0 md:space-x-4 font-bold space-y-4 md:space-y-0 mt-4 md:mt-0">
            
            <li><Link href="/tutor-registration" onClick={() => setIsMenuOpen(false)} className="hover:underline block text-right md:text-left text-[#0F1035]">教師登錄</Link></li>
            <li><Link href="/tutors" onClick={() => setIsMenuOpen(false)} className="hover:underline block text-right md:text-left text-[#0F1035]">家教老師</Link></li>
            <li><Link href="/tutor-cases" onClick={() => setIsMenuOpen(false)} className="hover:underline block text-right md:text-left text-[#0F1035]">家教案件</Link></li>
            <li className="group relative">
              <span className="hover:underline cursor-pointer block text-right md:text-left text-[#0F1035]">教師須知</span>
              <div className="md:bg-[#427A5B] md:absolute md:right-0 md:top-full hidden group-hover:block text-black md:text-white rounded-md md:shadow-lg md:p-2 md:z-50 md:min-w-[140px] md:whitespace-nowrap">
                <Link href="/process" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 hover:bg-white hover:text-[#0F1035] rounded-sm text-right md:text-left">
                  接案流程
                </Link>
              </div>
            </li>
            <li className="group relative">
              <span className="hover:underline cursor-pointer block text-right md:text-left text-[#0F1035]">家長須知</span>
              <div className="md:bg-[#427A5B] md:absolute md:right-0 md:top-full hidden group-hover:block text-black md:text-white rounded-md md:shadow-lg md:p-2 md:z-50 md:min-w-[140px] md:whitespace-nowrap">
                <Link href="/notice" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 hover:bg-white hover:text-[#0F1035] rounded-sm text-right md:text-left">
                  注意事項
                </Link>
                <Link href="/comparison" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 hover:bg-white hover:text-[#0F1035] rounded-sm text-right md:text-left">
                  與補習班之比較
                </Link>
                {/* <Link href="/license" className="block px-4 py-2 hover:bg-white hover:text-[#0F1035] rounded-sm text-right md:text-left">
                  政府立案
                </Link> */}
                <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 hover:bg-white hover:text-[#0F1035] rounded-sm text-right md:text-left">
                  家教費用參考
                </Link>
              </div>
            </li>
          </ul>
          
        </nav>
        <Link href="/case-upload" onClick={() => setIsMenuOpen(false)} className="hidden md:block hover:bg-[#B4CD93] inline-block text-right md:text-left bg-[#427A5B] px-4 text-white rounded-3xl">找家教</Link>
      </div>
    </header>
  )
}
