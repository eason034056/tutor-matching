'use client'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import TutorCasesClient from './tutor-cases/client'
import InfiniteCarousel from '@/components/infinite-carousel'

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
    <div className="container px-4 mx-auto text-center flex flex-col max-w-7xl">
      <div className="w-full">
        <h1 className="text-3xl font-bold text-center md:text-6xl mb-4 md:pt-4 pt-8">
          頂尖國立大學師資<br/>為孩子找到最適合的導師！
        </h1>
      </div>
      <p className="text-sm md:text-xl text-[#0F1035] text-bold mb-8 pt-4 md:block">由清華大學、交通大學畢業生創建的家教平台<br/>幫助家長根據需求找到最適合的家教老師，無須支付任何費用！</p>
    
      
      <div className="hidden md:flex justify-center items-end gap-4 mt-8">
        <div className="h-[20rem] w-[20%] bg-[#B4CD93] rounded-3xl flex flex-col justify-end">
          <div className="pb-8">
            <p className="text-left pl-4 py-6 pb-2 text-2xl font-semibold">線上免費解題</p>
            <p className="text-left px-4 text-sm">青椒老師AI解題，上傳題目照片馬上獲得詳解，不懂的還可以要求使用其他解題方式解釋，問到會為止，全部免費</p>
          </div>
        </div>
        <div className="h-48 w-[15%] bg-[#E8EAE6] rounded-3xl flex flex-col justify-center p-4">
          <div>
            <p className="text-center text-2xl font-semibold">3x</p>
            <p className="text-center text-sm">一對一輔導能將學生的專注力提升至集體課堂的3倍</p>
          </div>
        </div>
        <div className="h-[20rem] w-[30%] rounded-3xl flex flex-col justify-between">
          <div className="px-4 w-full gap-4 flex flex-col justify-center rounded-3xl">
            <Link href="/case-upload">
              <Button size="lg" className="bg-[#427A5B] text-white hover:bg-[#B4CD93]/80 rounded-3xl w-[60%]">家教諮詢</Button>
            </Link>
            <Link href="/tutor-cases">
              <Button size="lg" className="bg-[#E8EAE6] text-black hover:bg-[#CDD0CB]/80 rounded-3xl w-[60%]">案件專區</Button>
            </Link>
            <Link href="/solver">
              <Button size="lg" className="bg-[#0F1035] text-white hover:bg-[#B4CD93]/80 rounded-3xl w-[60%]">AI解題機器人</Button>
            </Link>
          </div>
            
          <div className="w-full bg-[#E8EAE6]/80 rounded-3xl">
            <p className="text-center pl-4 py-6 pb-2 text-2xl font-semibold">最適化配對</p>
            <p className="text-center px-4 pb-8 text-sm">青椒老師家教中心提供最適化配對，根據學生需求以及家教老師的專長，為學生找到最適合的家教老師</p>
          </div>
        </div>
        
        <div className="h-48 w-[15%] bg-[#B4CD93] rounded-3xl flex flex-col justify-center p-4">
          <div>
            <p className="text-center text-2xl font-semibold">2x</p>
            <p className="text-center text-sm">專業家教能將學生的學習動機提升至原本的2倍以上</p>
          </div>
        </div>
        <div className="h-[20rem] w-[20%] bg-[#E8EAE6] rounded-3xl flex flex-col justify-end">
          <div className="pb-8">
            <p className="text-left pl-4 py-6 pb-2 text-2xl font-semibold">免費安排讀書計畫</p>
            <p className="text-left px-4 text-sm">青椒老師家教中心提供免費的會考以及學測之讀書計畫，根據學生程度需求安排讀書計劃，幫助學生更有效地學習</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:hidden px-4 pb-8 w-full gap-4 justify-center rounded-3xl">
        <Link href="/case-upload">
          <Button size="lg" className="bg-[#427A5B] text-white hover:bg-[#B4CD93]/80 rounded-3xl w-[60%]">家教諮詢</Button>
        </Link>
        <Link href="/tutor-cases">
          <Button size="lg" className="bg-[#E8EAE6] text-black hover:bg-[#CDD0CB]/80 rounded-3xl w-[60%]">案件專區</Button>
        </Link>
        <Link href="/solver">
          <Button size="lg" className="bg-[#0F1035] text-white hover:bg-[#B4CD93]/80 rounded-3xl w-[60%]">AI解題機器人</Button>
        </Link>
      </div>
      <div className="flex flex-col md:hidden gap-4">
      <div className="w-[100%] bg-[#B4CD93] rounded-3xl flex-col justify-end">
        <div className="pb-8">
          <p className="text-left pl-4 py-6 pb-2 text-2xl font-semibold">線上免費解題</p>
          <p className="text-left px-4 text-sm">青椒老師AI解題，上傳題目照片馬上獲得詳解，不懂的還可以要求使用其他解題方式解釋，問到會為止，全部免費</p>
        </div>
      </div>
      <div className="w-[100%] bg-[#E8EAE6]/80 rounded-3xl flex-col justify-end">
        <div className="pb-8">
          <p className="text-left pl-4 py-6 pb-2 text-2xl font-semibold">最適化配對</p>
          <p className="text-left px-4 text-sm">青椒老師家教中心提供最適化配對，根據學生需求以及家教老師的專長，為學生找到最適合的家教老師</p>
        </div>
      </div>
      <div className="w-[100%] bg-[#E8EAE6] rounded-3xl flex-col justify-end">
        <div className="pb-8">
          <p className="text-left pl-4 py-6 pb-2 text-2xl font-semibold">免費讀書計畫</p>
          <p className="text-left px-4 text-sm">青椒老師家教中心提供免費的會考以及學測之讀書計畫，根據學生程度需求安排讀書計劃，幫助學生更有效地學習</p>
        </div>
      </div>
      </div>
      <div className="hidden md:block">
        {/* 使用新的 Carousel 元件 */}
        <InfiniteCarousel 
          images={logos}
          speed={0.1}
          className="my-8"
        />
      </div>
        <TutorCasesClient />
    </div>
  )
}
