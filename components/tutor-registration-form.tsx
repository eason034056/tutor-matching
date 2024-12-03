"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/server/config/firebase";
import { addWatermark } from "@/lib/imageUtils";

// 定義表單驗證規則
const formSchema = z.object({
  name: z.string().min(2, { message: "姓名至少需要2個字" }),
  phoneNumber: z.string().min(10, { message: "請輸入有效的電話號碼" }),
  subjects: z.string().min(1, { message: "請輸入教學科目" }),
  experience: z.string().min(1, { message: "請輸入教學經驗" }),
  school: z.string().min(1, { message: "請輸入就讀學校" }),
  major: z.string().min(1, { message: "請輸入主修科系" }),
  expertise: z.string().min(1, { message: "請輸入專長" }),
  studentIdCard: z.instanceof(FileList)
    .refine((files) => files.length > 0, "請上傳學生證照片"),
  idCard: z.instanceof(FileList)
    .refine((files) => files.length > 0, "請上傳身分證照片"),
})

export default function TutorRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previews, setPreviews] = useState({
    studentIdCard: '',
    idCard: ''
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      subjects: "",
      experience: "",
      school: "",
      major: "",
      expertise: "",
    },
  })

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
    } catch (error) {
      console.error('預覽圖片失敗:', error)
      toast.error('預覽圖片失敗')
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      
      // 處理圖片上傳
      const uploadImages = async () => {
        const imageUrls: { studentIdCard: string; idCard: string } = {
          studentIdCard: '',
          idCard: ''
        };
        
        if (values.studentIdCard[0]) {
          const watermarkedStudentId = await addWatermark(values.studentIdCard[0]);
          const studentIdRef = ref(storage, `tutors/student-ids/${Date.now()}-${values.studentIdCard[0].name}`);
          await uploadBytes(studentIdRef, watermarkedStudentId);
          imageUrls.studentIdCard = await getDownloadURL(studentIdRef);
        }
        
        if (values.idCard[0]) {
          const watermarkedId = await addWatermark(values.idCard[0]);
          const idRef = ref(storage, `tutors/id-cards/${Date.now()}-${values.idCard[0].name}`);
          await uploadBytes(idRef, watermarkedId);
          imageUrls.idCard = await getDownloadURL(idRef);
        }
        
        return imageUrls;
      };

      const imageUrls = await uploadImages();
      
      // 提交表單資料
      const response = await fetch('/api/tutors/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          studentIdCardUrl: imageUrls.studentIdCard,
          idCardUrl: imageUrls.idCard,
          tutorCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          isActive: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          subjects: values.subjects.split(' ').map(s => s.trim()),
        }),
      });
      
      const data = await response.json()
      console.log('Response:', data)

      if (!response.ok) throw new Error('提交失敗')

      toast.success("註冊成功！請等待管理員審核")
      form.reset()
    } catch (error) {
      toast.error("提交失敗，請稍後再試")
      console.error('Error:', error)
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
            render={({ field: { onChange, value, ...field } }) => (
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
                    <img 
                      src={previews.studentIdCard} 
                      alt="學生證預覽" 
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
            render={({ field: { onChange, value, ...field } }) => (
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
                    <img 
                      src={previews.idCard} 
                      alt="身分證預覽" 
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
          {isSubmitting ? "提交中..." : "提交"}
        </Button>
      </form>
    </Form>
  )
}

