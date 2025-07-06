import CaseUploadForm from '@/components/case-upload-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: '刊登家教需求 | 青椒老師家教中心 | 最專業最快速的家教媒合平台',
  description: '免費刊登家教需求，平台根據家長需求，快速找到合適的家教老師。提供便捷的家教媒合服務，讓您輕鬆找到理想的家教。',
  keywords: ['刊登家教', '找家教', '家教需求', '家教媒合', '家教', '找家教', '家教媒合', '家教怎麼找']
}

export default function CaseUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>家長登錄</CardTitle>
          <CardDescription>請填寫以下表單來提交您的家教需求，我們將盡快為您安排合適的家教老師。</CardDescription>
          <CardDescription>或是直接私訊我們，LINE ID：@home-tutor-tw</CardDescription>
        </CardHeader>
        <CardContent>
          <CaseUploadForm />
        </CardContent>
      </Card>
    </div>
  )
}

