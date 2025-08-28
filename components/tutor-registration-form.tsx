"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { addWatermark, compressImage } from "@/lib/imageUtils";
import Image from 'next/image'
import { XCircle, AlertCircle, Loader2, GraduationCap, Clock, ArrowRight, UserCheck, FileText, CheckCircle, CreditCard } from 'lucide-react'
import { useRouter } from "next/navigation";
import { sendWebhookNotification } from "@/webhook-config";
import TermsDialog from "@/components/TermsDialog"

// 定義表單驗證規則
const formSchema = z.object({
  name: z.string()
    .min(2, { message: "姓名至少需要2個字" })
    .max(50, { message: "姓名不能超過50個字" }),
  email: z.string()
    .email({ message: "請輸入有效的電子郵件格式" })
    .min(1, { message: "請輸入電子郵件" }),
  phoneNumber: z.string()
    .min(10, { message: "請輸入有效的手機號碼（10位數字）" })
    .max(15, { message: "電話號碼不能超過15位數字" })
    .regex(/^[0-9-+\s()]*$/, { message: "手機號碼只能包含數字" }),
  subjects: z.string()
    .min(1, { message: "請輸入教學科目" })
    .max(200, { message: "教學科目不能超過200個字" }),
  experience: z.string()
    .min(1, { message: "請輸入教學經驗" })
    .max(500, { message: "教學經驗描述不能超過500個字" }),
  school: z.string()
    .min(1, { message: "請輸入就讀學校" })
    .max(100, { message: "學校名稱不能超過100個字" }),
  major: z.string()
    .min(1, { message: "請輸入主修科系" })
    .max(100, { message: "主修科系不能超過100個字" }),
  expertise: z.string()
    .min(1, { message: "請輸入專長" })
    .max(300, { message: "專長描述不能超過300個字" }),
  receiveNewCaseNotifications: z.boolean().default(true),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "請閱讀並同意服務條款"
  }),
  studentIdCard: z.any()
    .refine((files) => {
      if (!files || files.length === 0) return false;
      const file = files[0];
      // 檢查檔案大小（5MB = 5 * 1024 * 1024 bytes）
      if (file && file.size > 5 * 1024 * 1024) return false;
      // 檢查檔案類型
      if (file && !['image/*'].includes(file.type)) return false;
      return true;
    }, "請上傳學生證照片（格式：JPG、PNG、WebP，大小不超過5MB）"),
  idCard: z.any()
    .refine((files) => {
      if (!files || files.length === 0) return false;
      const file = files[0];
      // 檢查檔案大小（5MB = 5 * 1024 * 1024 bytes）
      if (file && file.size > 5 * 1024 * 1024) return false;
      // 檢查檔案類型
      if (file && !['image/*'].includes(file.type)) return false;
      return true;
    }, "請上傳身分證照片（格式：JPG、PNG、WebP，大小不超過5MB）"),
})

export default function TutorRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [tutorCode, setTutorCode] = useState('')
  const [previews, setPreviews] = useState({
    studentIdCard: '',
    idCard: ''
  })
  // 檔案上傳錯誤狀態
  const [fileErrors, setFileErrors] = useState({
    studentIdCard: '',
    idCard: ''
  })
  const [fileInfos, setFileInfos] = useState({
    studentIdCard: '',
    idCard: ''
  })
  // 壓縮進度狀態
  const [isCompressing, setIsCompressing] = useState({
    studentIdCard: false,
    idCard: false
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      subjects: "",
      experience: "",
      school: "",
      major: "",
      expertise: "",
      receiveNewCaseNotifications: true,
      agreedToTerms: false,
    },
  })

  const router = useRouter();

  const handleImagePreview = async (
    file: File, 
    type: 'studentIdCard' | 'idCard'
  ) => {
    try {
      const originalSizeInMB = (file.size / (1024 * 1024)).toFixed(1)
      console.log(`檔案資訊: 名稱=${file.name}, 大小=${originalSizeInMB}MB, 類型=${file.type}, 上傳類型=${type}`)

      // 檢查檔案類型
      const allowedTypes = ['image/*']
      if (!allowedTypes.includes(file.type)) {
        // 設置UI錯誤訊息
        setFileErrors(prev => ({
          ...prev,
          [type]: `不支援的檔案格式！您選擇的是：${file.type}，請選擇JPG、PNG或WebP格式`
        }))
        setFileInfos(prev => ({ ...prev, [type]: '' }))
        setPreviews(prev => ({ ...prev, [type]: '' }))
        
        toast.error('不支援的檔案格式！請選擇JPG、PNG或WebP格式的圖片')
        return
      }

      // 清除之前的錯誤訊息
      setFileErrors(prev => ({ ...prev, [type]: '' }))
      
      // 自動壓縮圖片
      let processedFile = file
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      if (file.size > maxSize) {
        // 顯示壓縮進度
        setIsCompressing(prev => ({ ...prev, [type]: true }))
        setFileInfos(prev => ({ 
          ...prev, 
          [type]: `🔄 檔案較大 (${originalSizeInMB}MB)，正在自動壓縮...` 
        }))
        
        toast.info(`📦 正在自動壓縮${type === 'studentIdCard' ? '學生證' : '身分證'}圖片，請稍候...`)
        
        try {
          processedFile = await compressImage(file, 5) // 壓縮至5MB以下
          const compressedSizeInMB = (processedFile.size / (1024 * 1024)).toFixed(1)
          
          setFileInfos(prev => ({ 
            ...prev, 
            [type]: `✅ 壓縮完成！從 ${originalSizeInMB}MB 壓縮至 ${compressedSizeInMB}MB` 
          }))
          toast.success(`🎉 ${type === 'studentIdCard' ? '學生證' : '身分證'}自動壓縮成功！從 ${originalSizeInMB}MB 壓縮至 ${compressedSizeInMB}MB`)
          
        } catch (compressionError) {
          console.error('圖片壓縮失敗:', compressionError)
          setFileErrors(prev => ({ 
            ...prev, 
            [type]: '圖片壓縮失敗！請嘗試選擇較小的圖片或使用其他圖片' 
          }))
          setFileInfos(prev => ({ ...prev, [type]: '' }))
          toast.error('圖片壓縮失敗，請嘗試選擇較小的圖片')
          return
        } finally {
          setIsCompressing(prev => ({ ...prev, [type]: false }))
        }
      } else {
        // 檔案已經小於限制
        setFileInfos(prev => ({ 
          ...prev, 
          [type]: `✅ 檔案大小適中！大小：${originalSizeInMB}MB` 
        }))
        toast.success(`${type === 'studentIdCard' ? '學生證' : '身分證'}圖片選擇成功！大小：${originalSizeInMB}MB`)
      }

      // 添加浮水印並預覽 - 浮水印版本將上傳到雲端
      const watermarkedBlob = await addWatermark(processedFile)
      
      // 將浮水印版本轉換為File對象，這個版本會上傳到雲端
      const watermarkedFile = new File([watermarkedBlob], processedFile.name, {
        type: watermarkedBlob.type,
        lastModified: Date.now()
      })
      
      // 更新表單數據為浮水印版本
      // 創建一個FileList-like對象來符合表單期望的類型
      const fileList = Object.assign([watermarkedFile], {
        item: (index: number) => index === 0 ? watermarkedFile : null,
        length: 1
      }) as FileList
      form.setValue(type, fileList)
      
      // 顯示預覽
      const previewUrl = URL.createObjectURL(watermarkedBlob)
      setPreviews(prev => ({
        ...prev,
        [type]: previewUrl
      }))
      
      // 重置提交狀態
      if (submitStatus !== 'idle') {
        setSubmitStatus('idle')
      }
      
    } catch (error) {
      console.error('預覽圖片失敗:', error)
      
      // 設置UI錯誤訊息
      setFileErrors(prev => ({
        ...prev,
        [type]: '圖片處理失敗！請確認檔案是否為有效的圖片格式，或嘗試選擇其他圖片'
      }))
      setFileInfos(prev => ({ ...prev, [type]: '' }))
      setPreviews(prev => ({ ...prev, [type]: '' }))
      
      toast.error('預覽圖片失敗，請確認檔案是否為有效的圖片格式')
    } finally {
      setIsCompressing(prev => ({ ...prev, [type]: false }))
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      setSubmitStatus('idle')
      
      // 處理圖片上傳
      const uploadImages = async () => {
        const imageUrls: { studentIdCard: string; idCard: string } = {
          studentIdCard: '',
          idCard: ''
        };
        
        if (values.studentIdCard && values.studentIdCard[0]) {
          console.log('開始上傳學生證...')
          imageUrls.studentIdCard = await uploadImage(values.studentIdCard[0], 'tutors', 'student-ids')
          console.log('學生證上傳完成:', imageUrls.studentIdCard)
        }
        
        if (values.idCard && values.idCard[0]) {
          console.log('開始上傳身分證...')
          imageUrls.idCard = await uploadImage(values.idCard[0], 'tutors', 'id-cards')
          console.log('身分證上傳完成:', imageUrls.idCard)
        }
        
        return imageUrls;
      };

      console.log('開始上傳圖片...')
      const imageUrls = await uploadImages();
      console.log('圖片上傳完成:', imageUrls)
      
      const generatedTutorCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      // 準備提交資料
      const submitData = {
        ...values,
        studentIdCardUrl: imageUrls.studentIdCard,
        idCardUrl: imageUrls.idCard,
        tutorCode: generatedTutorCode,
        isActive: false,
        status: 'pending',
        createdAt: new Date().toISOString(),
        subjects: values.subjects.split(' ').map(s => s.trim()),
      }

      console.log('準備提交資料:', submitData)
      
      // 提交表單資料 - 改善錯誤處理
      const response = await fetch('/api/tutors/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      let data;
      try {
        // 檢查回應的Content-Type是否為JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
          console.log('API Response:', data)
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
        const errorMessage = data?.error || data?.details || `提交失敗 (錯誤代碼: ${response.status})`
        throw new Error(errorMessage)
      }

      // 成功狀態
      setSubmitStatus('success')
      setTutorCode(generatedTutorCode)
      setSubmitMessage(`您的教師編號是 ${generatedTutorCode}，請妥善保存。我們會在 1-2 個工作天內完成審核。`)

      // 觸發 n8n webhook 發送管理員通知
      await sendWebhookNotification('new_tutor', submitData)

    } catch (error) {
      console.error('提交失敗:', error)
      setSubmitStatus('error')
      setSubmitMessage(error instanceof Error ? error.message : '提交失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previews.studentIdCard)
      URL.revokeObjectURL(previews.idCard)
    }
  }, [previews])

  // 處理重置表單
  const handleReset = () => {
    form.reset({
      name: "",
      email: "",
      phoneNumber: "",
      subjects: "",
      experience: "",
      school: "",
      major: "",
      expertise: "",
      receiveNewCaseNotifications: true,
      agreedToTerms: false, // 重置條款同意狀態
    })
    setPreviews({
      studentIdCard: '',
      idCard: ''
    })
    setFileErrors({
      studentIdCard: '',
      idCard: ''
    })
    setFileInfos({
      studentIdCard: '',
      idCard: ''
    })
    setIsCompressing({
      studentIdCard: false,
      idCard: false
    })
    setSubmitStatus('idle')
  }

  // 如果提交成功，顯示成功頁面
  if (submitStatus === 'success') {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-bounce mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <UserCheck className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            註冊成功！
          </h2>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <GraduationCap className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-green-800 font-medium mb-2">歡迎加入我們的教師團隊</p>
                <p className="text-green-700 text-sm leading-relaxed">
                  {submitMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="text-center">
              <p className="text-blue-800 font-semibold mb-2">您的教師編號</p>
              <div className="bg-white border border-blue-200 rounded-lg px-4 py-3">
                <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                  {tutorCode}
                </span>
              </div>
              <p className="text-blue-600 text-xs mt-2">請截圖保存此編號</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-amber-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">預計審核時間：1-2 個工作天</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleReset}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              註冊新教師
            </Button>
            
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              返回首頁
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
            註冊失敗
          </h2>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-red-800 font-medium mb-2">註冊過程中發生錯誤</p>
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電子郵件</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="例如：your.name@email.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電話號碼</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例如：0912345678 或 02-12345678" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subjects"
          render={({ field }) => (
            <FormItem>
              <FormLabel>可教授科目</FormLabel>
              <FormControl>
                <Input {...field} placeholder="請用空格分隔多個科目，例如：國文 國中英文 國中數學 高中數學" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>教學經驗</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例如：5年補教經驗，曾任職補習班講師"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="school"
          render={({ field }) => (
            <FormItem>
              <FormLabel>就讀學校</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="major"
          render={({ field }) => (
            <FormItem>
              <FormLabel>主修科系</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expertise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>專長</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例如：高中數學、大學微積分"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receiveNewCaseNotifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50/50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium">
                  📧 接收新案件通知
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  當有新的家教案件審核通過時，我願意透過電子郵件接收通知
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">證件上傳</h2>
              <p className="text-sm text-gray-500">請上傳清晰的證件照片，系統會自動加上浮水印保護</p>
            </div>
          </div>
          
          <FormField
            control={form.control}
            name="studentIdCard"
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            render={({ field: { value: _value, onChange, ...field } }) => (
              <FormItem>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <GraduationCap className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-lg font-medium text-emerald-900">學生證照片</h3>
                  </div>
                  
                  {/* 簡化的上傳說明 */}
                  <div className="bg-white rounded-lg p-4 mb-4 border border-emerald-100">
                    <div className="text-sm text-emerald-800 space-y-1">
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
                    </div>
                  </div>

                  <FormControl>
                    <div className="relative">
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              onChange(e.target.files)
                              handleImagePreview(file, 'studentIdCard')
                            }
                          }}
                          {...field}
                          disabled={isCompressing.studentIdCard}
                          className={`w-full h-32 border-2 border-dashed rounded-lg transition-all duration-200 opacity-0 absolute inset-0 cursor-pointer ${
                            isCompressing.studentIdCard ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        />
                        <div className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 ${
                          isCompressing.studentIdCard 
                            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                            : 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50/80'
                        }`}>
                          {!isCompressing.studentIdCard ? (
                            <>
                              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                <GraduationCap className="w-6 h-6 text-emerald-600" />
                              </div>
                              <p className="text-sm font-medium text-emerald-700 mb-1">點擊或拖拽上傳學生證照片</p>
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
                  </FormControl>

                  {/* 狀態反饋 */}
                  {fileErrors.studentIdCard && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-red-800">上傳失敗</h4>
                          <p className="text-sm text-red-600 mt-1">{fileErrors.studentIdCard}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {fileInfos.studentIdCard && !fileErrors.studentIdCard && (
                    <div className="mt-4 bg-emerald-100 border border-emerald-300 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {isCompressing.studentIdCard ? (
                            <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-800">
                            {fileInfos.studentIdCard}
                          </p>
                          <p className="text-xs text-emerald-600 mt-1">
                            {isCompressing.studentIdCard 
                              ? '系統正在優化圖片品質與大小...' 
                              : '學生證上傳成功！請繼續上傳身分證。'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 預覽圖片 */}
                  {previews.studentIdCard && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-emerald-800 mb-2">預覽（已加浮水印保護）</p>
                      <div className="relative overflow-hidden rounded-lg border border-emerald-200">
                        <Image
                          src={previews.studentIdCard} 
                          alt="學生證預覽" 
                          width={400}
                          height={240}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                  
                  <FormMessage className="mt-2" />
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="idCard"
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            render={({ field: { value: _value, onChange, ...field } }) => (
              <FormItem>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-lg font-medium text-emerald-900">身分證照片</h3>
                  </div>
                  
                  {/* 簡化的上傳說明 */}
                  <div className="bg-white rounded-lg p-4 mb-4 border border-emerald-100">
                    <div className="text-sm text-emerald-800 space-y-1">
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
                    </div>
                  </div>

                  <FormControl>
                    <div className="relative">
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              onChange(e.target.files)
                              handleImagePreview(file, 'idCard')
                            }
                          }}
                          {...field}
                          disabled={isCompressing.idCard}
                          className={`w-full h-32 border-2 border-dashed rounded-lg transition-all duration-200 opacity-0 absolute inset-0 cursor-pointer ${
                            isCompressing.idCard ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        />
                        <div className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 ${
                          isCompressing.idCard 
                            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                            : 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50/80'
                        }`}>
                          {!isCompressing.idCard ? (
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
                  </FormControl>

                  {/* 狀態反饋 */}
                  {fileErrors.idCard && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-red-800">上傳失敗</h4>
                          <p className="text-sm text-red-600 mt-1">{fileErrors.idCard}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {fileInfos.idCard && !fileErrors.idCard && (
                    <div className="mt-4 bg-emerald-100 border border-emerald-300 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {isCompressing.idCard ? (
                            <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-800">
                            {fileInfos.idCard}
                          </p>
                          <p className="text-xs text-emerald-600 mt-1">
                            {isCompressing.idCard 
                              ? '系統正在優化圖片品質與大小...' 
                              : '身分證上傳成功！現在可以提交表單了。'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 預覽圖片 */}
                  {previews.idCard && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-emerald-800 mb-2">預覽（已加浮水印保護）</p>
                      <div className="relative overflow-hidden rounded-lg border border-emerald-200">
                        <Image
                          src={previews.idCard} 
                          alt="身分證預覽" 
                          width={400}
                          height={240}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                  
                  <FormMessage className="mt-2" />
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="agreedToTerms"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="flex-1">
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      我已閱讀並同意服務條款 *
                    </FormLabel>
                    <div className="mt-2">
                      <TermsDialog onAgree={() => form.setValue('agreedToTerms', true)}>
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
                      ⚠️ 註冊前請先閱讀並同意我們的服務條款
                    </p>
                  </div>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              提交中...
            </div>
          ) : (
            '提交'
          )}
        </Button>
      </form>
    </Form>
  )
}
