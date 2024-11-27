import { tutors } from '../data/tutors'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TutorsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">尋找合適的家教老師</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutors.map((tutor) => (
          <Card key={tutor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-2xl">{tutor.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">教學科目:</span>
                <span>{tutor.subjects.join(', ')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">教學經驗:</span>
                <span>{tutor.experience}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">學校:</span>
                <span>{tutor.school}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">科系:</span>
                <span>{tutor.major}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">專長:</span>
                <span>{tutor.expertise}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
