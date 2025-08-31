import TutorRegistrationForm from '@/components/tutor-registration-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, FileText, ArrowRight, Users, Clock, GraduationCap } from "lucide-react"

export const metadata = {
  title: '家教老師註冊立即接案 | 青椒老師家教中心 | 最專業最快速的家教媒合平台',
  description: '歡迎優秀的家教老師加入我們的平台。提供彈性的教學時間，合理的薪資待遇，讓您在課餘時間創造額外收入。',
  keywords: ['家教註冊', '家教兼職', '家教工作', '教師註冊', '家教', '找家教', '家教媒合', '家教怎麼找']
}

export default function TutorRegistrationPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* 頁面標題 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">教師登錄</h1>
        <p className="text-lg text-gray-600 mb-2">
          選擇您偏好的方式開始教師註冊
        </p>
        <p className="text-sm text-gray-500">
          我們提供兩種便利的方式讓您快速加入我們的教師團隊
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* 快速聯繫 CTA 區域 */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                方式一：即時LINE諮詢
              </h2>
              
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                直接與我們的專業團隊對話，了解教師註冊流程與獲得個人化的教學機會推薦
              </p>

              {/* 優勢列表 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">快速審核</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">專業輔導</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-sm font-medium">教學支援</span>
                </div>
              </div>

              {/* LINE 聯繫按鈕 */}
              <a
                href="https://line.me/ti/p/~home-tutor-tw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <MessageCircle className="w-5 h-5 mr-3" />
                  立即加入 LINE 諮詢
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Button>
              </a>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">
                  LINE ID：home-tutor-tw
                </p>
                <p className="text-xs text-green-600 font-medium">
                  ✨ 點擊按鈕立即加入好友，無需搜尋ID
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 分隔線 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-50 text-gray-500 font-medium">或者</span>
          </div>
        </div>

        {/* 表單填寫區域 */}
        <Card className="bg-white border-blue-200 shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center bg-black-100 rounded-full my-6">
              <FileText className="w-8 h-8 text-black-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900 mb-3">
              方式二：詳細註冊表單
            </CardTitle>
            <CardDescription className="text-gray-600 text-base max-w-lg mx-auto">
              請填寫以下表單以登錄成為教師。登錄完後會進行身份審核，審核時間大約1~2天，審核完畢後會收到email傳送教師編號。請記得您的教師編號，後續接案都需使用教師編號進行應徵。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TutorRegistrationForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
