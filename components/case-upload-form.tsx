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
import Image from 'next/image'
import { CheckCircle, XCircle, AlertCircle, Loader2, FileText, Clock, ArrowRight } from 'lucide-react'

export default function CaseUploadForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
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
    // 重置提交狀態當用戶開始編輯
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle')
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevState => ({ ...prevState, [name]: value }))
    // 重置提交狀態當用戶開始編輯
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle')
    }
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
        // 重置提交狀態
        if (submitStatus !== 'idle') {
          setSubmitStatus('idle')
        }
      } catch (error) {
        console.error('預覽圖片失敗:', error)
        toast.error('預覽圖片失敗')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
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

      // 使用 API 路由提交資料
      const response = await fetch('/api/cases/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      })

      const result = await response.json()
      console.log('API Response:', result)

      if (!response.ok) {
        throw new Error(result.error || '提交失敗')
      }

      // 成功狀態
      setSubmitStatus('success')
      setSubmitMessage(`案件已成功提交！審核時間約需1-2天，請耐心等候。`)
      
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

    } catch (error) {
      console.error('送出需求時發生錯誤:', error)
      setSubmitStatus('error')
      setSubmitMessage(error instanceof Error ? error.message : '提交失敗，請重試')
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

  // 如果提交成功，顯示成功頁面
  if (submitStatus === 'success') {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-bounce mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            提交成功！
          </h2>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-green-800 font-medium mb-2">您的需求已成功送出</p>
                <p className="text-green-700 text-sm leading-relaxed">
                  {submitMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-blue-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">預計審核時間：1-2 個工作天</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/case-upload')}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
            
            <Button 
              onClick={() => setSubmitStatus('idle')}
              variant="outline"
              className="w-full"
            >
              繼續提交新案件
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 如果提交失敗，顯示錯誤狀態
  if (submitStatus === 'error') {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-pulse mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            提交失敗
          </h2>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-red-800 font-medium mb-2">提交過程中發生錯誤</p>
                <p className="text-red-700 text-sm leading-relaxed">
                  {submitMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => setSubmitStatus('idle')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              重新填寫表單
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/case-upload')}
              className="w-full"
            >
              返回首頁
            </Button>
          </div>
        </div>
      </div>
    )
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
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            提交中...
          </div>
        ) : (
          '送出需求'
        )}
      </Button>
    </form>
  )
}

