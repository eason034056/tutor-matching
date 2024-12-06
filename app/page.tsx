import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="container mx-auto text-center min-h-screen flex flex-col">
      <div className="container bg-[#B9D7EA] mx-auto mb-8 rounded-3xl">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <div className="w-fit md:ml-12">
              <h1 className="text-3xl text-center md:text-left text-[#0F1035] font-bold mt-8 w-fit">歡迎來到新竹家教網</h1>
              <div className="flex flex-row my-4 text-center md:text-left w-full">
                <Link href="/tutor-registration" className="flex-1 pr-2">
                  <Button size="lg" className="bg-[#415F9D] text-white hover:bg-[#415F9D]/80 rounded-3xl w-full">接家教</Button>
                </Link>
                <Link href="/case-upload" className="flex-1 pl-2">
                  <Button size="lg" className="bg-[#415F9D] text-white hover:bg-[#415F9D]/80 rounded-3xl w-full">找家教</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 flex items-end">
            <img 
              src="/cover.png" 
              alt="家教老師與學生" 
              className="max-w-[600px] w-full"
            />
          </div>
        </div>
      </div>
      
      <p className="text-xl text-[#0F1035] text-bold mb-8 pt-8">由清華、交大畢業生創建的專業家教平台，專注新竹地區家教媒合<br/>幫助您輕鬆找到最適合的家教老師！</p>
      <div className="hidden md:flex justify-center items-end gap-4 mt-8">
        <div className="h-56 w-1/5 bg-[#D6E6F2] rounded-3xl">
          <p className="text-left pl-4 py-6 pb-2 text-4xl font-semibold">80%</p>
          <p className="text-left px-4 text-sm">以上的家長認為，個性化的家教能有效提高孩子的學習成績</p>
        </div>
        <div className="h-48 w-1/5 bg-[#DFEFF0] rounded-3xl">
          <p className="text-left pl-4 py-6 pb-2 text-4xl font-semibold">3x</p>
          <p className="text-left px-4 text-sm">一對一輔導能將學生的專注力提升至集體課堂的3倍</p>
        </div>
        <div className="h-40 w-1/5 bg-[#F7FBFC] rounded-3xl">
          <p className="text-left pl-4 py-6 pb-2 text-4xl font-semibold">83%</p>
          <p className="text-left px-4 pb-4 text-sm">在家教輔導後，對學業的自信心顯著增強的學生比例</p>
        </div>
        <div className="h-48 w-1/5 bg-[#DFEFF0] rounded-3xl">
          <p className="text-left pl-4 py-6 pb-2 text-4xl font-semibold">2X</p>
          <p className="text-left px-4 pb-4 text-sm">專業家教能將學生的學習動機提升至原本的2倍以上</p>
        </div>
        <div className="h-56 w-1/5 bg-[#D6E6F2] rounded-3xl">
          <p className="text-left pl-4 py-6 pb-2 text-4xl font-semibold">91%</p>
          <p className="text-left px-4 pb-4 text-sm">學生認為，相比於補習班，家教老師的個性化教學能幫助他們更快速掌握難點</p>
        </div>
      </div>
    </div>
  )
}
