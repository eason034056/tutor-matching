"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { registerTutor } from '@/app/actions/register-tutor'

const subjects = [
  "數學", "英文", "自然", "歷史", "電腦",
  "物理", "化學", "生物", "國文", "其他外語"
]

export default function TutorRegistrationForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    subjects: [] as string[],
    experience: '',
    school: '',
    major: '',
    locations: '',
    expertise: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prevState => ({ ...prevState, [name]: value }))
  }

  const handleSubjectChange = (subject: string) => {
    setFormData(prevState => ({
      ...prevState,
      subjects: prevState.subjects.includes(subject)
        ? prevState.subjects.filter(s => s !== subject)
        : [...prevState.subjects, subject]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await registerTutor(formData)
      alert('註冊成功！')
      router.push('/tutors')
    } catch (error) {
      console.error('註冊失敗:', error)
      alert('註冊失敗，請重試。')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">姓名</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="phoneNumber">聯絡電話</Label>
        <Input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label>可教授科目</Label>
        <div className="grid grid-cols-2 gap-2">
          {subjects.map((subject) => (
            <div key={subject} className="flex items-center space-x-2">
              <Checkbox
                id={subject}
                checked={formData.subjects.includes(subject)}
                onCheckedChange={() => handleSubjectChange(subject)}
              />
              <label
                htmlFor={subject}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {subject}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="experience">相關經驗</Label>
        <Textarea
          id="experience"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="school">就讀學校</Label>
        <Input
          id="school"
          name="school"
          value={formData.school}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="major">主修科系</Label>
        <Input
          id="major"
          name="major"
          value={formData.major}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="locations">可授課地區</Label>
        <Input
          id="locations"
          name="locations"
          value={formData.locations}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="expertise">專長領域</Label>
        <Textarea
          id="expertise"
          name="expertise"
          value={formData.expertise}
          onChange={handleChange}
          required
        />
      </div>
      <Button type="submit">註冊成為家教</Button>
    </form>
  )
}

