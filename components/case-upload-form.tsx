"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadCase } from '@/app/actions/upload-case'

export default function CaseUploadForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    idNumber: '',
    studentGender: '',
    lineId: '',
    department: '',
    grade: '',
    studentDescription: '',
    subject: '',
    location: '',
    availableTime: '',
    teacherRequirements: '',
    hourlyFee: '',
    message: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prevState => ({ ...prevState, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevState => ({ ...prevState, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await uploadCase(formData)
      alert('需求已成功送出！')
      router.push('/tutor-cases')
    } catch (error) {
      console.error('送出需求時發生錯誤:', error)
      alert('送出需求失敗，請重試。')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">基本資料</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="parentName">家長姓名</Label>
            <Input
              id="parentName"
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="parentPhone">聯絡電話</Label>
            <Input
              id="parentPhone"
              name="parentPhone"
              type="tel"
              value={formData.parentPhone}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="parentEmail">電子信箱</Label>
            <Input
              id="parentEmail"
              name="parentEmail"
              type="email"
              value={formData.parentEmail}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="address">聯絡地址</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="idNumber">身分證字號</Label>
            <Input
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>學生性別</Label>
            <Select onValueChange={(value) => handleSelectChange('studentGender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇性別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">男</SelectItem>
                <SelectItem value="female">女</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="lineId">LINE ID</Label>
            <Input
              id="lineId"
              name="lineId"
              value={formData.lineId}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="department">就讀科系</Label>
            <Input
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>年級</Label>
            <Select onValueChange={(value) => handleSelectChange('grade', value)}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇年級" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="國小">國小</SelectItem>
                <SelectItem value="國中">國中</SelectItem>
                <SelectItem value="高中">高中</SelectItem>
                <SelectItem value="大學">大學</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="studentDescription">學生狀況描述</Label>
          <Textarea
            id="studentDescription"
            name="studentDescription"
            value={formData.studentDescription}
            onChange={handleChange}
            placeholder="請描述學生的學習狀況、程度等"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">家教需求</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subject">需求科目</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>上課地點</Label>
            <Select onValueChange={(value) => handleSelectChange('location', value)}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇上課地點" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="學生家">學生家</SelectItem>
                <SelectItem value="教師家">教師家</SelectItem>
                <SelectItem value="線上">線上</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="availableTime">可上課時段</Label>
            <Input
              id="availableTime"
              name="availableTime"
              value={formData.availableTime}
              onChange={handleChange}
              placeholder="例：週一至週五晚上、週末下午"
              required
            />
          </div>
          <div>
            <Label htmlFor="hourlyFee">期望時薪</Label>
            <Input
              id="hourlyFee"
              name="hourlyFee"
              type="number"
              value={formData.hourlyFee}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="teacherRequirements">教師條件要求</Label>
          <Textarea
            id="teacherRequirements"
            name="teacherRequirements"
            value={formData.teacherRequirements}
            onChange={handleChange}
            placeholder="請說明對教師的特殊要求（例如：性別、教學經驗等）"
          />
        </div>

        <div>
          <Label htmlFor="message">補充說明</Label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="其他補充說明事項"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">送出需求</Button>
    </form>
  )
}

