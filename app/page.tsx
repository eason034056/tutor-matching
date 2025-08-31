'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import TutorCasesClient from './tutor-cases/client'
import InfiniteCarousel from '@/components/infinite-carousel'
import { ScrollAnimationWrapper } from '@/hooks/useScrollAnimation'
import { Users, ArrowRight, Sparkles } from 'lucide-react'

// 圖片路徑
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

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
        <div className="container px-6 mx-auto text-center max-w-4xl">
          {/* Profile Image */}
          <div className="mb-8 relative">
                         {/* 聊天泡泡 */}
             <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
               <Link href="/solver" className="group">
                 <div className="bg-white rounded-2xl px-4 py-3 shadow-lg border border-neutral-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
                   <div className="flex items-center space-x-2">
                                           <span className="text-sm font-medium text-neutral-800 whitespace-nowrap">點擊進入青椒老師解題AI</span>
                                           <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse flex-shrink-0"></div>
                   </div>
                   {/* 聊天泡泡的小三角形 */}
                   <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
                 </div>
               </Link>
             </div>
            
            {/* Profile Image */}
            <div className="w-48 h-48 mx-auto mb-4 relative">
              <Link href="/solver" className="group">
                <Image 
                  src="/teacher-icon.png" 
                  alt="青椒老師家教中心" 
                  width={192}
                  height={192}
                  className="w-full h-full object-cover rounded-full cursor-pointer transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            </div>
          </div>
          
          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
            為孩子找到<br />
            最適合的<span className="text-brand-600">家教老師</span>
          </h1>
          
          <p className="text-xl text-neutral-600 mb-12 max-w-2xl mx-auto">
            由清華大學、交通大學畢業生創建的家教平台<br />
            幫助家長根據需求找到最適合的家教老師
          </p>
          
          {/* 超級醒目的 CTA Button */}
          <div className="relative">
            {/* 背景光暈效果 */}
            <div className="absolute inset-0 -m-4 "></div>
            
            <Link href="/case-upload" className="relative block">
              <Button 
                size="lg" 
                className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 text-white font-bold px-12 py-6 rounded-full text-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 hover:scale-105 border-2 border-white/20"
              >
                {/* 按鈕內部光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* 閃爍效果 */}
                <div className="absolute top-0 left-0 w-full h-full">
                  <Sparkles className="absolute top-2 left-4 w-4 h-4 text-white/80 animate-pulse" />
                  <Sparkles className="absolute bottom-2 right-6 w-3 h-3 text-yellow-200 animate-pulse" style={{animationDelay: '1s'}} />
                </div>
                
                <div className="relative flex items-center justify-center space-x-3">
                  <Users className="w-6 h-6" />
                  <span className="font-extrabold tracking-wide">家長找家教</span>
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                </div>
                
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <ScrollAnimationWrapper>
        <section className="py-20 bg-white">
          <div className="container px-6 mx-auto max-w-6xl">
            <ScrollAnimationWrapper delay={200}>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                  許多頂尖大學老師
                </h2>
                <p className="text-neutral-600 text-lg">
                  為學生提供最優質的教育資源
                </p>
              </div>
            </ScrollAnimationWrapper>
            
            {/* Logo Carousel */}
            <ScrollAnimationWrapper delay={400}>
              {/* 桌面版：標準大小輪播 */}
              <div className="hidden md:block">
                <InfiniteCarousel 
                  images={logos}
                  speed={0.1}
                  className="my-8"
                />
              </div>
              
              {/* 手機版：大尺寸輪播 */}
              <div className="md:hidden">
                <InfiniteCarousel 
                  images={logos}
                  speed={0.3}
                  imageWidth={180}
                  imageHeight={90}
                  className="my-8"
                />
              </div>
            </ScrollAnimationWrapper>
          </div>
        </section>
      </ScrollAnimationWrapper>

      {/* Services Section */}
      <ScrollAnimationWrapper>
        <section className="py-20 bg-neutral-50">
          <div className="container px-6 mx-auto max-w-6xl">
            <ScrollAnimationWrapper delay={200}>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                  我們的服務
                </h2>
                <p className="text-neutral-600 text-lg">
                  提供全方位的教育解決方案
                </p>
              </div>
            </ScrollAnimationWrapper>
            
            <div className="grid md:grid-cols-4 gap-8">
              <ScrollAnimationWrapper delay={400}>
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-brand-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">AI解題機器人</h3>
                  <p className="text-neutral-600 text-sm">
                    上傳題目照片馬上獲得詳解，問到會為止，全部免費
                  </p>
                </div>
              </ScrollAnimationWrapper>
              
              <ScrollAnimationWrapper delay={500}>
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-brand-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">最適化配對</h3>
                  <p className="text-neutral-600 text-sm">
                    根據學生需求以及家教老師的專長，找到最適合的配對
                  </p>
                </div>
              </ScrollAnimationWrapper>
              
              <ScrollAnimationWrapper delay={600}>
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-brand-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">讀書計畫</h3>
                  <p className="text-neutral-600 text-sm">
                    提供免費的會考以及學測讀書計畫，幫助學生更有效學習
                  </p>
                </div>
              </ScrollAnimationWrapper>
              
              <ScrollAnimationWrapper delay={700}>
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-brand-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">快速媒合</h3>
                  <p className="text-neutral-600 text-sm">
                    專業團隊快速為您找到合適的家教老師，無須支付任何費用
                  </p>
                </div>
              </ScrollAnimationWrapper>
            </div>
          </div>
        </section>
      </ScrollAnimationWrapper>

      {/* CTA Section */}
      <ScrollAnimationWrapper>
        <section className="py-20 bg-white">
          <div className="container px-6 mx-auto text-center max-w-4xl">
            <ScrollAnimationWrapper delay={200}>
              <div className="mb-8">
                <div className="w-16 h-16 bg-brand-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper delay={400}>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
                告訴我們您的需求
              </h2>
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper delay={600}>
              <p className="text-xl text-neutral-600 mb-12">
                讓我們為您的孩子找到最適合的學習夥伴
              </p>
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper delay={800}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/case-upload">
                  <Button size="lg" className="bg-brand-500 text-white hover:bg-brand-600 px-8 py-4 rounded-full text-lg font-medium transition-colors">
                    開始諮詢
                  </Button>
                </Link>
                <Link href="/tutor-cases">
                  <Button size="lg" variant="outline" className="border-brand-300 text-brand-700 hover:bg-brand-50 px-8 py-4 rounded-full text-lg font-medium transition-colors">
                    瀏覽案件
                  </Button>
                </Link>
              </div>
            </ScrollAnimationWrapper>
          </div>
        </section>
      </ScrollAnimationWrapper>

      {/* Cases Section */}
      <ScrollAnimationWrapper>
        <section className="py-20 bg-neutral-50">
          <div className="container px-6 mx-auto max-w-6xl">
            <TutorCasesClient />
          </div>
        </section>
      </ScrollAnimationWrapper>
    </div>
  )
}
