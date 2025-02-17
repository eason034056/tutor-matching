"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/server/config/firebase";
import { addWatermark } from "@/lib/imageUtils";
import { toast } from "sonner"
import { collection, addDoc} from 'firebase/firestore'
import Image from 'next/image'
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
    region: '',
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
      
      const caseData = {
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        parentEmail: formData.parentEmail,
        address: formData.address,
        idNumber: formData.idNumber,
        studentGender: formData.studentGender,
        lineId: formData.lineId,
        department: formData.department,
        grade: formData.grade,
        studentDescription: formData.studentDescription,
        subject: formData.subject,
        location: formData.location,
        region: formData.region,
        availableTime: formData.availableTime,
        teacherRequirements: formData.teacherRequirements,
        hourlyFee: parseInt(formData.hourlyFee),
        message: formData.message,
        idCardUrl,
        caseNumber,
        status: '急徵',
        pending: 'pending',
        createdAt: new Date().toISOString(),
      }

      const casesRef = collection(db, 'cases')
      const docRef = await addDoc(casesRef, caseData)
      console.log('Case uploaded with ID:', docRef.id)

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
        region: '',
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
            <Label>地區</Label>
            <Select 
              onValueChange={(value) => handleSelectChange('region', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="請選擇地區" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="線上">線上</SelectItem>
                <SelectItem value="基隆">基隆</SelectItem>
                <SelectItem value="台北">台北</SelectItem>
                <SelectItem value="新北">新北</SelectItem>
                <SelectItem value="桃園">桃園</SelectItem>
                <SelectItem value="新竹">新竹</SelectItem>
                <SelectItem value="苗栗">苗栗</SelectItem>
                  <SelectItem value="台中">台中</SelectItem>
                  <SelectItem value="彰化">彰化</SelectItem>
                  <SelectItem value="南投">南投</SelectItem>
                  <SelectItem value="雲林">雲林</SelectItem>
                  <SelectItem value="嘉義">嘉義</SelectItem>
                  <SelectItem value="台南">台南</SelectItem>
                  <SelectItem value="高雄">高雄</SelectItem>
                  <SelectItem value="屏東">屏東</SelectItem>
                  <SelectItem value="宜蘭">宜蘭</SelectItem>
                  <SelectItem value="花蓮">花蓮</SelectItem>
                  <SelectItem value="台東">台東</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              <Image
                src={preview} 
                alt="身分證預覽" 
                width={500}
                height={300}
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

