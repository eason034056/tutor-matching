import TutorRegistrationForm from '@/components/tutor-registration-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TutorRegistrationPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>教師登錄</CardTitle>
          <CardDescription>請填寫以下表單以登錄成為教師<br />
          登錄完後會進行身份審核，審核時間大約1~2天，審核完畢後會收到email傳送教師編號<br />
          請記得您的教師編號，後續接案都需使用教師編號進行應徵</CardDescription>
        </CardHeader>
        <CardContent>
          <TutorRegistrationForm />
        </CardContent>
      </Card>
    </div>
  )
}
