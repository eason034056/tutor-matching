import TutorRegistrationForm from '@/components/tutor-registration-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TutorRegistrationPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>家教註冊</CardTitle>
          <CardDescription>請填寫以下表單以註冊成為家教</CardDescription>
        </CardHeader>
        <CardContent>
          <TutorRegistrationForm />
        </CardContent>
      </Card>
    </div>
  )
}
