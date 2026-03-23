"use client"

import type { UseFormReturn } from "react-hook-form"

import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { TutorFormValues } from "@/lib/tutor-form"

type TeachingProfileStepProps = {
  form: UseFormReturn<TutorFormValues>
}

const inputClassName = "h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4"

export default function TeachingProfileStep({ form }: TeachingProfileStepProps) {
  return (
    <section className="rounded-[1.8rem] border border-brand-100 bg-white/95 p-5 shadow-[0_18px_50px_rgba(67,102,78,0.06)] md:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold tracking-[0.22em] text-brand-500">STEP 2</p>
        <h2 className="mt-2 font-display text-2xl text-brand-900 md:text-3xl">說明教學背景與專長</h2>
        <p className="mt-2 text-sm leading-7 text-neutral-600">資訊越完整，顧問越能快速判斷與安排後續媒合。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="subjects"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>可教授科目</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例如：國中數學 高中數學 高中物理" className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="experience"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>教學經驗</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例如：3 年家教，帶過會考與學測" className={inputClassName} />
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
                <Input {...field} placeholder="例如：國立清華大學" className={inputClassName} />
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
                <Input {...field} placeholder="例如：資訊工程學系" className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expertise"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>專長</FormLabel>
              <FormControl>
                <Input {...field} placeholder="例如：會考衝刺、觀念建立、考前複習規劃" className={inputClassName} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="receiveNewCaseNotifications"
        render={({ field }) => (
          <FormItem className="mt-5 rounded-[1.5rem] border border-brand-100 bg-[#f8f5ea] px-4 py-4">
            <div className="flex items-start gap-3">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
              </FormControl>
              <div>
                <FormLabel className="text-sm font-semibold text-brand-900">接收新案件通知</FormLabel>
                <p className="mt-1 text-sm leading-6 text-neutral-600">新案件通過審核時，自動寄 email 通知你。</p>
              </div>
            </div>
          </FormItem>
        )}
      />
    </section>
  )
}
