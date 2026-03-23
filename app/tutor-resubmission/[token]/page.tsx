"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, RefreshCcw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import TutorRegistrationForm from "@/components/tutor-registration-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type VerifiedTutor = {
  tutorCode?: string
  name: string
  email: string
  phoneNumber: string
  subjects: string[]
  experience: string
  school: string
  major: string
  expertise: string
  receiveNewCaseNotifications: boolean
  studentIdCardUrl?: string
  idCardUrl?: string
}

export default function TutorResubmissionPage() {
  const params = useParams<{ token: string }>()
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token || ""
  const [phoneTail, setPhoneTail] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verifiedTutor, setVerifiedTutor] = useState<VerifiedTutor | null>(null)

  const verifyToken = async () => {
    if (phoneTail.trim().length < 3) {
      toast.error("請輸入電話末三碼")
      return
    }

    setVerifying(true)

    try {
      const response = await fetch(`/api/tutor-resubmission/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneTail: phoneTail.trim() }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "驗證失敗")
      }

      setVerifiedTutor(result)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "驗證失敗")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="relative overflow-hidden bg-[#f7f3e8] text-neutral-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top_left,_rgba(180,205,147,0.44),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(66,122,91,0.18),_transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.36),transparent_24%,transparent_78%,rgba(255,255,255,0.2))]" />

      <section className="relative px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,250,242,0.92))] p-6 shadow-[0_30px_90px_rgba(67,102,78,0.12)] md:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-4 py-2 text-xs font-semibold tracking-[0.28em] text-brand-700">
              <ShieldCheck className="h-4 w-4" />
              TUTOR RESUBMISSION
            </div>
            <h1 className="mt-5 font-display text-[2.2rem] leading-[1.04] text-brand-900 sm:text-5xl lg:text-[3.65rem]">
              透過專屬連結補件，更新後重新送審
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              先驗證電話末三碼，再依退件說明更新資料。證件改為選檔即上傳，不需等到最後一步才知道結果。
            </p>
          </div>

          {!verifiedTutor ? (
            <div className="rounded-[2rem] border border-brand-100 bg-white/95 p-6 shadow-[0_24px_70px_rgba(67,102,78,0.08)] md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold tracking-[0.24em] text-brand-700">
                <RefreshCcw className="h-4 w-4" />
                VERIFY LINK
              </div>
              <h2 className="mt-5 font-display text-2xl text-brand-900 md:text-3xl">先驗證電話末三碼</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-600">請輸入申請時留下的電話末三碼，確認你有權限更新這筆申請。</p>

              <div className="mt-6 max-w-sm">
                <Label htmlFor="phoneTail" className="text-sm font-semibold text-brand-900">
                  電話末三碼
                </Label>
                <Input
                  id="phoneTail"
                  className="mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4 text-lg tracking-[0.24em]"
                  inputMode="numeric"
                  maxLength={3}
                  value={phoneTail}
                  onChange={(event) => setPhoneTail(event.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="例如 678"
                />
              </div>

              <Button size="lg" className="mt-6 min-h-12 rounded-full bg-brand-500 px-6 text-base text-white hover:bg-brand-600" onClick={verifyToken} disabled={verifying}>
                {verifying ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    驗證中...
                  </span>
                ) : (
                  "驗證補件連結"
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-[2.1rem] border border-brand-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,249,242,0.92))] p-5 shadow-[0_32px_100px_rgba(67,102,78,0.08)] md:p-6 lg:p-8">
              <TutorRegistrationForm
                mode="resubmission"
                resubmissionToken={token}
                phoneTail={phoneTail}
                initialValues={verifiedTutor}
                existingDocuments={{
                  studentIdCardUrl: verifiedTutor.studentIdCardUrl,
                  idCardUrl: verifiedTutor.idCardUrl,
                }}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
