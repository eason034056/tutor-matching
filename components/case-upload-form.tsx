"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addWatermark, compressImage } from "@/lib/imageUtils";
import { toast } from "sonner"
import Image from 'next/image'
import { CheckCircle, XCircle, AlertCircle, Loader2, FileText, Clock, ArrowRight, CreditCard } from 'lucide-react'
import { sendWebhookNotification } from "@/webhook-config"
import TermsDialog from "@/components/TermsDialog"
import { Checkbox } from "@/components/ui/checkbox"

export default function CaseUploadForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [preview, setPreview] = useState('')
  // 追蹤用戶是否同意服務條款
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false)
  // 檔案上傳錯誤狀態
  const [fileError, setFileError] = useState('')
  const [fileInfo, setFileInfo] = useState('')
  // 壓縮進度狀態
  const [isCompressing, setIsCompressing] = useState(false)
  
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

  // 處理身分證預覽 - 加入自動壓縮功能
  const handleIdCardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const originalSizeInMB = (file.size / (1024 * 1024)).toFixed(1)
        console.log(`檔案資訊: 名稱=${file.name}, 大小=${originalSizeInMB}MB, 類型=${file.type}`)

        // 檢查檔案類型
        const allowedTypes = ['image/*']
        if (!allowedTypes.includes(file.type)) {
          // 設置UI錯誤訊息
          setFileError(`不支援的檔案格式！您選擇的是：${file.type}，請選擇JPG、PNG或WebP格式`)
          setFileInfo('')
          setPreview('')
          setFormData(prev => ({ ...prev, idCard: null }))
          
          toast.error('不支援的檔案格式！請選擇JPG、PNG或WebP格式的圖片')
          // 清空input的值
          e.target.value = ''
          return
        }

        // 清除之前的錯誤訊息
        setFileError('')
        
        // 自動壓縮圖片
        let processedFile = file
        const maxSize = 5 * 1024 * 1024 // 5MB
        
        if (file.size > maxSize) {
          // 顯示壓縮進度
          setIsCompressing(true)
          setFileInfo(`🔄 檔案較大 (${originalSizeInMB}MB)，正在自動壓縮...`)
          
          toast.info('📦 正在自動壓縮圖片，請稍候...')
          
          try {
            processedFile = await compressImage(file, 5) // 壓縮至5MB以下
            const compressedSizeInMB = (processedFile.size / (1024 * 1024)).toFixed(1)
            
            setFileInfo(`✅ 壓縮完成！從 ${originalSizeInMB}MB 壓縮至 ${compressedSizeInMB}MB`)
            toast.success(`🎉 自動壓縮成功！從 ${originalSizeInMB}MB 壓縮至 ${compressedSizeInMB}MB`)
            
          } catch (compressionError) {
            console.error('圖片壓縮失敗:', compressionError)
            setFileError('圖片壓縮失敗！請嘗試選擇較小的圖片或使用其他圖片')
            toast.error('圖片壓縮失敗，請嘗試選擇較小的圖片')
            e.target.value = ''
            return
          } finally {
            setIsCompressing(false)
          }
        } else {
          // 檔案已經小於限制
          setFileInfo(`✅ 檔案大小適中！大小：${originalSizeInMB}MB`)
          toast.success(`圖片選擇成功！大小：${originalSizeInMB}MB`)
        }

        // 添加浮水印並預覽 - 浮水印版本將上傳到雲端
        const watermarkedBlob = await addWatermark(processedFile)
        
        // 將浮水印版本轉換為File對象，這個版本會上傳到雲端
        const watermarkedFile = new File([watermarkedBlob], processedFile.name, {
          type: watermarkedBlob.type,
          lastModified: Date.now()
        })
        
        // 顯示預覽並更新表單數據為浮水印版本
        const previewUrl = URL.createObjectURL(watermarkedBlob)
        setPreview(previewUrl)
        setFormData(prev => ({ ...prev, idCard: watermarkedFile }))
        
        // 重置提交狀態
        if (submitStatus !== 'idle') {
          setSubmitStatus('idle')
        }
        
      } catch (error) {
        console.error('預覽圖片失敗:', error)
        
        // 設置UI錯誤訊息
        setFileError('圖片處理失敗！請確認檔案是否為有效的圖片格式，或嘗試選擇其他圖片')
        setFileInfo('')
        setPreview('')
        setFormData(prev => ({ ...prev, idCard: null }))
        
        toast.error('預覽圖片失敗，請確認檔案是否為有效的圖片格式')
        // 清空input的值
        e.target.value = ''
      } finally {
        setIsCompressing(false)
      }
    }
  }

  // 上傳圖片到 API - 改善錯誤處理
  const uploadImage = async (file: File, folder: string, subfolder: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    formData.append('subfolder', subfolder)

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // 檢查回應的Content-Type是否為JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json()
          throw new Error(error.error || error.details || `圖片上傳失敗 (${response.status})`)
        } else {
          // 如果不是JSON，讀取為純文字
          const errorText = await response.text()
          console.error('伺服器回傳非JSON格式錯誤:', errorText)
          
          // 根據HTTP狀態碼提供更友善的錯誤訊息
          if (response.status === 413) {
            throw new Error('圖片檔案太大，請選擇小於5MB的圖片')
          } else if (response.status === 415) {
            throw new Error('不支援的圖片格式，請選擇JPG、PNG或WebP格式')
          } else if (response.status >= 500) {
            throw new Error('伺服器暫時無法處理請求，請稍後再試')
          } else {
            throw new Error(`圖片上傳失敗 (錯誤代碼: ${response.status})`)
          }
        }
      }

      // 檢查成功回應是否為JSON格式
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('伺服器回應格式錯誤')
      }

      const result = await response.json()
      if (!result.url) {
        throw new Error('伺服器未回傳圖片網址')
      }
      
      return result.url
    } catch (error) {
      console.error('圖片上傳詳細錯誤:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 檢查是否同意服務條款
    if (!hasAgreedToTerms) {
      toast.error('請先閱讀並同意服務條款')
      return
    }

    // 表單驗證
    const validationErrors = []

    // 檢查必填欄位
    if (!formData.parentName.trim()) validationErrors.push('請填寫家長姓名')
    if (!formData.parentPhone.trim()) validationErrors.push('請填寫聯絡電話')
    if (!formData.address.trim()) validationErrors.push('請填寫聯絡地址')
    if (!formData.idNumber.trim()) validationErrors.push('請填寫身分證字號')
    if (!formData.studentGender) validationErrors.push('請選擇學生性別')
    if (!formData.department.trim()) validationErrors.push('請填寫就讀學校')
    if (!formData.grade) validationErrors.push('請選擇年級')
    if (!formData.studentDescription.trim()) validationErrors.push('請填寫學生狀況描述')
    if (!formData.region) validationErrors.push('請選擇地區')
    if (!formData.subject.trim()) validationErrors.push('請填寫需求科目')
    if (!formData.location.trim()) validationErrors.push('請填寫上課地點')
    if (!formData.availableTime.trim()) validationErrors.push('請填寫可上課時段')
    if (!formData.hourlyFee.trim() || Number(formData.hourlyFee) <= 0) validationErrors.push('請填寫有效的期望時薪')
    if (!formData.idCard) validationErrors.push('請上傳身分證照片')

    // 檢查電話號碼格式
    const phoneRegex = /^[0-9-+\s()]*$/
    if (formData.parentPhone && !phoneRegex.test(formData.parentPhone)) {
      validationErrors.push('電話號碼格式不正確，只能包含數字和橫線')
    }
    if (formData.parentPhone && formData.parentPhone.length < 10) {
      validationErrors.push('手機號碼需要10位數字，例如：0912345678 或 02-12345678')
    }

    // 檢查email格式
    if (formData.parentEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.parentEmail)) {
        validationErrors.push('電子信箱格式不正確')
      }
    }

    // 檢查身分證字號格式（台灣身分證字號格式）
    const idRegex = /^[A-Z][12]\d{8}$/
    if (formData.idNumber && !idRegex.test(formData.idNumber.toUpperCase())) {
      validationErrors.push('身分證字號格式不正確（例如：A123456789）')
    }

    // 如果有驗證錯誤，顯示第一個錯誤並停止提交
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0])
      return
    }
    
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    try {
      let idCardUrl = ''
      
      // 上傳身分證照片
      if (formData.idCard) {
        console.log('開始上傳身分證照片...')
        idCardUrl = await uploadImage(formData.idCard, 'cases', 'id-cards')
        console.log('身分證照片上傳完成:', idCardUrl)
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
        hourlyFee: Number(formData.hourlyFee),
        message: formData.message,
        idCardUrl,
        caseNumber,
        status: '急徵',
        pending: 'pending',
        createdAt: new Date().toISOString(),
      }

      // 使用 API 路由提交資料 - 改善錯誤處理
      const response = await fetch('/api/cases/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      })

      let result;
      try {
        // 檢查回應的Content-Type是否為JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          result = await response.json()
          console.log('API Response:', result)
        } else {
          // 如果不是JSON，讀取為純文字並拋出錯誤
          const errorText = await response.text()
          console.error('伺服器回傳非JSON格式:', errorText)
          throw new Error('伺服器回應格式錯誤，請稍後再試')
        }
      } catch (jsonError) {
        console.error('JSON解析錯誤:', jsonError)
        throw new Error('伺服器回應解析失敗，請稍後再試')
      }

      if (!response.ok) {
        const errorMessage = result?.error || result?.details || `提交失敗 (錯誤代碼: ${response.status})`
        throw new Error(errorMessage)
      }

      // 成功狀態
      setSubmitStatus('success')
      setSubmitMessage(`案件已成功提交！審核時間約需1-2天，請耐心等候。`)
      
      // 觸發 n8n webhook 發送管理員通知
      await sendWebhookNotification('new_case', caseData)
      
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
      setHasAgreedToTerms(false) // 重置條款同意狀態

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
              placeholder="例如：0912345678 或 02-12345678"
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
              placeholder="例如：your.name@email.com"
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
              placeholder="例如：A123456789"
              maxLength={10}
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
              step="1"
              min="0"
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

      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">身分證件上傳</h2>
            <p className="text-sm text-gray-500">請上傳清晰的身分證照片，系統會自動加上浮水印保護</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <h3 className="text-lg font-medium text-emerald-900">身分證照片</h3>
          </div>
          
          {/* 簡化的上傳說明 */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-emerald-100">
            <div className="text-sm text-emerald-800 space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>支援 JPG、PNG、WebP 格式</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>系統自動壓縮大檔案至 5MB 以下</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>自動加入浮水印保護並上傳</span>
              </div>
              <div className="bg-emerald-50/30 p-3 rounded-lg border border-emerald-100 mt-3">
                <p className="text-xs text-emerald-700">
                  <strong>📋 上傳說明：</strong>
                  高中以下學生請上傳家長身分證，大學以上學生請上傳本人身分證
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative">
              <Input
                id="idCard"
                type="file"
                accept="image/*"
                onChange={handleIdCardChange}
                required
                disabled={isCompressing}
                className={`w-full h-32 border-2 border-dashed rounded-lg transition-all duration-200 opacity-0 absolute inset-0 cursor-pointer ${
                  isCompressing ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
              <div className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 ${
                isCompressing 
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                  : 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50/80'
              }`}>
                {!isCompressing ? (
                  <>
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                      <CreditCard className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-emerald-700 mb-1">點擊或拖拽上傳身分證照片</p>
                    <p className="text-xs text-emerald-600">支援 JPG、PNG、WebP 格式</p>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
                    <p className="text-sm text-gray-500">正在處理圖片...</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 狀態反饋 */}
          {fileError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">上傳失敗</h4>
                  <p className="text-sm text-red-600 mt-1">{fileError}</p>
                </div>
              </div>
            </div>
          )}

          {fileInfo && !fileError && (
            <div className="mt-4 bg-emerald-100 border border-emerald-300 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {isCompressing ? (
                    <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    {fileInfo}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {isCompressing 
                      ? '系統正在優化圖片品質與大小...' 
                      : '身分證上傳成功！請繼續填寫表單其他資料。'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 預覽圖片 */}
          {preview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-emerald-800 mb-2">預覽（已加浮水印保護）</p>
              <div className="relative overflow-hidden rounded-lg border border-emerald-200">
                <Image
                  src={preview} 
                  alt="身分證預覽" 
                  width={400}
                  height={240}
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 服務條款同意區域 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">服務條款</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="pt-1">
              <Checkbox
                id="terms-agreement"
                checked={hasAgreedToTerms}
                onCheckedChange={(checked) => setHasAgreedToTerms(!!checked)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="terms-agreement" className="text-sm font-medium cursor-pointer">
                我已閱讀並同意
              </Label>
              <div className="mt-2">
                <TermsDialog onAgree={() => setHasAgreedToTerms(true)}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    查看服務條款
                  </Button>
                </TermsDialog>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                ⚠️ 提交前請先閱讀並同意我們的服務條款
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting || !hasAgreedToTerms}>
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            提交中...
          </div>
        ) : hasAgreedToTerms ? (
          '送出需求'
        ) : (
          '請先同意服務條款'
        )}
      </Button>
    </form>
  )
}

