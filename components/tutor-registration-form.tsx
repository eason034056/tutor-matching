"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { addWatermark } from "@/lib/imageUtils";
import Image from 'next/image'
import { XCircle, AlertCircle, Loader2, GraduationCap, Clock, ArrowRight, UserCheck } from 'lucide-react'
import { useRouter } from "next/navigation";
import { sendWebhookNotification } from "@/webhook-config";

// 定義表單驗證規則
const formSchema = z.object({
  name: z.string().min(2, { message: "姓名至少需要2個字" }),
  email: z.string().email({ message: "請輸入有效的電子郵件" }),
  phoneNumber: z.string().min(10, { message: "請輸入有效的電話號碼" }),
  subjects: z.string().min(1, { message: "請輸入教學科目" }),
  experience: z.string().min(1, { message: "請輸入教學經驗" }),
  school: z.string().min(1, { message: "請輸入就讀學校" }),
  major: z.string().min(1, { message: "請輸入主修科系" }),
  expertise: z.string().min(1, { message: "請輸入專長" }),
  studentIdCard: z.any()
    .refine((files) => !files || files instanceof FileList, "請上傳學生證照片"),
  idCard: z.any()
    .refine((files) => !files || files instanceof FileList, "請上傳身分證照片"),
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
    },
  })

  const router = useRouter();

  const handleImagePreview = async (
    file: File, 
    type: 'studentIdCard' | 'idCard'
  ) => {
    try {
      const watermarkedBlob = await addWatermark(file)
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
      toast.error('預覽圖片失敗')
    }
  }

  // 上傳圖片到 API
  const uploadImage = async (file: File, folder: string, subfolder: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    formData.append('subfolder', subfolder)

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '圖片上傳失敗')
    }

    const result = await response.json()
    return result.url
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
      
      // 提交表單資料
      const response = await fetch('/api/tutors/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      const data = await response.json()
      console.log('API Response:', data)

      if (!response.ok) {
        throw new Error(data.error || data.details || '提交失敗')
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
    form.reset()
    setPreviews({
      studentIdCard: '',
      idCard: ''
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
                <Input {...field} />
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
                <Input {...field} />
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

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">證件上傳</h2>
          
          <FormField
            control={form.control}
            name="studentIdCard"
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            render={({ field: { value: _value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>學生證照片</FormLabel>
                <FormControl>
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
                  />
                </FormControl>
                {previews.studentIdCard && (
                  <div className="mt-2">
                    <Image
                      src={previews.studentIdCard} 
                      alt="學生證預覽" 
                      width={500}
                      height={300}
                      className="w-full rounded-lg shadow-md"
                    />
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="idCard"
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            render={({ field: { value: _value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>身分證照片</FormLabel>
                <FormControl>
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
                  />
                </FormControl>
                {previews.idCard && (
                  <div className="mt-2">
                    <Image
                      src={previews.idCard} 
                      alt="身分證預覽" 
                      width={500}
                      height={300}
                      className="w-full rounded-lg shadow-md"
                    />
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
