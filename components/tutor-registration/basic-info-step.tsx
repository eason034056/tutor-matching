"use client"

import type { UseFormReturn } from "react-hook-form"

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { TutorFormValues } from "@/lib/tutor-form"

type BasicInfoStepProps = {
  form: UseFormReturn<TutorFormValues>
}

const inputClassName = "h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4"

export default function BasicInfoStep({ form }: BasicInfoStepProps) {
  return (
    <section className="rounded-[1.8rem] border border-brand-100 bg-white/95 p-5 shadow-[0_18px_50px_rgba(67,102,78,0.06)] md:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold tracking-[0.22em] text-brand-500">STEP 1</p>
        <h2 className="mt-2 font-display text-2xl text-brand-900 md:text-3xl">填寫基本聯絡資料</h2>
        <p className="mt-2 text-sm leading-7 text-neutral-600">先確認聯絡資訊，審核結果與教師編號會寄到這個信箱。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名</FormLabel>
              <FormControl>
                <Input {...field} placeholder="請輸入姓名" className={inputClassName} />
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
                <Input {...field} type="email" placeholder="name@email.com" className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>電話號碼</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例如：0912345678" className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  )
}
