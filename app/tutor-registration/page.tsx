import TutorRegistrationForm from '@/components/tutor-registration-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: '家教老師註冊立即接案 | 優學家教媒合平台 | 最專業最快速的家教媒合平台',
  description: '歡迎優秀的家教老師加入我們的平台。提供彈性的教學時間，合理的薪資待遇，讓您在課餘時間創造額外收入。',
  keywords: ['家教註冊', '家教兼職', '家教工作', '教師註冊', '新竹家教', '新竹找家教', '台北家教', '台北找家教', '家教媒合', '家教怎麼找', '新竹找家教推薦', '台北找家教推薦']
}

export default function TutorRegistrationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">家教老師註冊申請 | 加入我們的專業教師團隊</h1>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>教師登錄</CardTitle>
          <CardDescription>請填寫以下表單以登錄成為教師<br />
          登錄完後會進行身份審核，審核時間大約1~2天，審核完畢後會收到email傳送教師編號<br />
          請記得您的教師編號，後續接案都需使用教師編號進行應徵<br />
          或是直接私訊我們，LINE ID：@home-tutor-tw</CardDescription>
        </CardHeader>
        <CardContent>
          <TutorRegistrationForm />
        </CardContent>
      </Card>
    </div>
  )
}
