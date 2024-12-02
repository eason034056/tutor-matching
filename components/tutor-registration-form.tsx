"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

// 定義表單驗證規則
const formSchema = z.object({
  name: z.string().min(2, { message: "姓名至少需要2個字" }),
  phoneNumber: z.string().min(10, { message: "請輸入有效的電話號碼" }),
  subjects: z.string().min(1, { message: "請輸入教學科目" }),
  experience: z.string().min(1, { message: "請輸入教學經驗" }),
  school: z.string().min(1, { message: "請輸入就讀學校" }),
  major: z.string().min(1, { message: "請輸入主修科系" }),
  expertise: z.string().min(1, { message: "請輸入專長" }),
})

export default function TutorRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      
      const tutorCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const response = await fetch('/api/tutors/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          tutorCode,
          isActive: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          subjects: values.subjects.split(' ').map(s => s.trim()),
        }),
      })
      
      const data = await response.json()

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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "提交中..." : "提交"}
        </Button>
      </form>
    </Form>
  )
}

