"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/server/config/firebase";
import { addWatermark } from "@/lib/imageUtils";
import { toast } from "sonner"

export default function CaseUploadForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [preview, setPreview] = useState('')
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
    message: '',
    pending: 'pending',
    idCard: null as File | null,
    idCardUrl: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prevState => ({ ...prevState, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevState => ({ ...prevState, [name]: value }))
  }

  // 處理身分證預覽
  const handleIdCardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // 添加浮水印並預覽
        const watermarkedBlob = await addWatermark(file)
        const previewUrl = URL.createObjectURL(watermarkedBlob)
        setPreview(previewUrl)
        setFormData(prev => ({ ...prev, idCard: file }))
      } catch (error) {
        console.error('預覽圖片失敗:', error)
        toast.error('預覽圖片失敗')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      let idCardUrl = ''
      
      // 上傳身分證照片
      if (formData.idCard) {
        const watermarkedId = await addWatermark(formData.idCard)
        const idRef = ref(storage, `cases/id-cards/${Date.now()}-${formData.idCard.name}`)
        await uploadBytes(idRef, watermarkedId)
        idCardUrl = await getDownloadURL(idRef)
      }

      const caseNumber = 'C' + Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const response = await fetch('/api/cases/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          idCardUrl,  // 添加身分證 URL
          caseNumber,
          status: '急徵',
          pending: 'pending',  // 添加審核狀態
          createdAt: new Date().toISOString(),
          hourlyFee: parseInt(formData.hourlyFee)
        }),
      })

      if (!response.ok) {
        throw new Error('提交失敗')
      }

      const data = await response.json()
      console.log('Response:', data)

      // 清空表單資料
      setFormData({
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
        message: '',
        pending: 'pending',
        idCard: null,
        idCardUrl: '',
      })
      setPreview('')

      // 使用原生 alert
      alert('需求已成功送出！案件審核時間大約需要1-2天，請耐心等候。')
      router.push('/case-upload')
    } catch (error) {
      console.error('送出需求時發生錯誤:', error)
      alert('送出需求失敗，請重試。')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 清理預覽 URL
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

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
            <Label htmlFor="department">就讀學校</Label>
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
                <SelectItem value="小一">小一</SelectItem>
                <SelectItem value="小二">小二</SelectItem>
                <SelectItem value="小三">小三</SelectItem>
                <SelectItem value="小四">小四</SelectItem>
                <SelectItem value="小五">小五</SelectItem>
                <SelectItem value="小六">小六</SelectItem>
                <SelectItem value="國一">國一</SelectItem>
                <SelectItem value="國二">國二</SelectItem>
                <SelectItem value="國三">國三</SelectItem>
                <SelectItem value="高一">高一</SelectItem>
                <SelectItem value="高二">高二</SelectItem>
                <SelectItem value="高三">高三</SelectItem>
                <SelectItem value="大一">大一</SelectItem>
                <SelectItem value="大二">大二</SelectItem>
                <SelectItem value="大三">大三</SelectItem>
                <SelectItem value="大四">大四</SelectItem>
                <SelectItem value="成人">成人</SelectItem>
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
            placeholder="請描述學生的學習狀況、程度等，以方便家教老師根據學生程度調整教學方式"
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
            <Label htmlFor="location">上課地點</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="請輸入大概位置即可"
              required
            />
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

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">家長身分證上傳</h2>
        <div>
          <Label htmlFor="idCard">若學生為大學以上，請上傳自己的身分證照片，證件皆會加上浮水印，僅供家教網審核使用</Label>
          <Input
            id="idCard"
            type="file"
            accept="image/*"
            onChange={handleIdCardChange}
            required
          />
          {preview && (
            <div className="mt-2">
              <img 
                src={preview} 
                alt="身分證預覽" 
                className="w-full rounded-lg shadow-md"
              />
            </div>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "提交中..." : "送出需求"}
      </Button>
    </form>
  )
}

