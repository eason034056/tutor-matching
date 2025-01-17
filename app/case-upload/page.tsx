import CaseUploadForm from '@/components/case-upload-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

