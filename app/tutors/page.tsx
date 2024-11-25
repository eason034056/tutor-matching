import { tutors } from '../data/tutors'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TutorRequestForm from '@/components/tutor-request-form'

export default function TutorsPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Available Tutors</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutors.map((tutor) => (
              <Card key={tutor.id}>
                <CardHeader>
                  <CardTitle>{tutor.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Subject:</strong> {tutor.subject}</p>
                  <p><strong>Experience:</strong> {tutor.experience} years</p>
                  <p><strong>Hourly Rate:</strong> ${tutor.hourlyRate}</p>
                  <Button className="mt-4">Request Tutor</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Request a Tutor</CardTitle>
            </CardHeader>
            <CardContent>
              <TutorRequestForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

