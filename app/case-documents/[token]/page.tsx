"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { processImageComplete } from '@/lib/imageUtils'

const idRegex = /^[A-Z][12]\d{8}$/

type Stage = 'verify' | 'upload' | 'success'

export default function CaseDocumentsPage() {
  const params = useParams<{ token: string }>()
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token || ''

  const [stage, setStage] = useState<Stage>('verify')
  const [phoneTail, setPhoneTail] = useState('')
  const [caseNumber, setCaseNumber] = useState('')
  const [parentName, setParentName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const verifyPhoneTail = async () => {
    if (phoneTail.trim().length < 3) {
      toast.error('請輸入電話末三碼')
      return
    }

    setVerifying(true)
    try {
      const response = await fetch(`/api/case-documents/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneTail: phoneTail.trim() }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '驗證失敗')
      }

      setCaseNumber(result.caseNumber || '')
      setParentName(result.parentName || '')
      setStage('upload')
    } catch (error) {
      console.error('驗證補件連結失敗:', error)
      toast.error(error instanceof Error ? error.message : '驗證失敗')
    } finally {
      setVerifying(false)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片檔案')
      return
    }

    try {
      const processed = await processImageComplete(file, 5)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setSelectedFile(processed)
      setPreviewUrl(URL.createObjectURL(processed))
      toast.success('證件照片處理完成')
    } catch (error) {
      console.error('處理證件照片失敗:', error)
      toast.error('證件照片處理失敗，請重新選擇')
    }
  }

  const uploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'cases')
    formData.append('subfolder', 'document-follow-up')

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    if (!response.ok || !result.url) {
      throw new Error(result.error || result.details || '圖片上傳失敗')
    }

    return result.url as string
  }

  const submitDocuments = async () => {
    if (!idRegex.test(idNumber.trim().toUpperCase())) {
      toast.error('請填寫正確的身分證字號')
      return
    }
    if (!selectedFile) {
      toast.error('請先上傳身分證照片')
      return
    }

    setSubmitting(true)
    try {
      const imageUrl = await uploadImage(selectedFile)
      const response = await fetch(`/api/case-documents/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneTail: phoneTail.trim(),
          idNumber: idNumber.trim().toUpperCase(),
          idCardUrl: imageUrl,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || '補件送出失敗')
      }

      setStage('success')
      toast.success('補件已完成')
    } catch (error) {
      console.error('補件送出失敗:', error)
      toast.error(error instanceof Error ? error.message : '補件送出失敗')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f3e8] px-4 py-8 text-neutral-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(245,250,242,0.92))] p-6 shadow-[0_30px_90px_rgba(67,102,78,0.12)] md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-4 py-2 text-xs font-semibold tracking-[0.28em] text-brand-700">
            <ShieldCheck className="h-4 w-4" />
            DOCUMENT FOLLOW-UP
          </div>
          <h1 className="mt-5 font-display text-3xl text-brand-900 md:text-5xl">補上證件資料，顧問就能完成下一步確認</h1>
          <p className="mt-4 text-base leading-8 text-neutral-600">這個頁面只會在顧問確認需求後提供。請先驗證電話末三碼，再補上身分證字號與證件照片。</p>
        </div>

        {stage === 'verify' && (
          <div className="rounded-[2rem] border border-brand-100 bg-white/95 p-6 shadow-[0_24px_70px_rgba(67,102,78,0.08)] md:p-8">
            <h2 className="font-display text-2xl text-brand-900 md:text-3xl">先驗證電話末三碼</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600">為了避免補件連結被誤用，先輸入家長電話末三碼進行驗證。</p>
            <div className="mt-6 max-w-sm">
              <Label htmlFor="phoneTail" className="text-sm font-semibold text-brand-900">電話末三碼</Label>
              <Input
                id="phoneTail"
                className="mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4 text-lg tracking-[0.24em]"
                inputMode="numeric"
                maxLength={3}
                value={phoneTail}
                onChange={(event) => setPhoneTail(event.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="例如 678"
              />
            </div>
            <Button size="lg" className="mt-6 min-h-12 rounded-full bg-brand-500 px-6 text-base text-white hover:bg-brand-600" onClick={verifyPhoneTail} disabled={verifying}>
              {verifying ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  驗證中...
                </span>
              ) : (
                '驗證補件連結'
              )}
            </Button>
          </div>
        )}

        {stage === 'upload' && (
          <div className="rounded-[2rem] border border-brand-100 bg-white/95 p-6 shadow-[0_24px_70px_rgba(67,102,78,0.08)] md:p-8">
            <div className="rounded-[1.5rem] border border-brand-100 bg-[#f8f5ea] p-4 text-sm text-neutral-700">
              <div>案件編號：{caseNumber}</div>
              <div className="mt-1">聯絡人：{parentName || '家長'}</div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <Label htmlFor="idNumber" className="text-sm font-semibold text-brand-900">身分證字號</Label>
                <Input
                  id="idNumber"
                  className="mt-3 h-12 rounded-2xl border-brand-200 bg-[#fffdf8] px-4 uppercase"
                  value={idNumber}
                  onChange={(event) => setIdNumber(event.target.value.toUpperCase())}
                  placeholder="例如：A123456789"
                />
              </div>

              <div>
                <Label htmlFor="idCard" className="text-sm font-semibold text-brand-900">身分證照片</Label>
                <label htmlFor="idCard" className="mt-3 flex min-h-[12rem] cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-brand-300 bg-[#f8f5ea] p-5 text-center transition-colors hover:border-brand-400 hover:bg-brand-50">
                  <UploadCloud className="h-10 w-10 text-brand-600" />
                  <div className="mt-3 text-base font-semibold text-brand-900">點擊上傳身分證照片</div>
                  <div className="mt-2 text-sm leading-6 text-neutral-600">系統會先處理圖片大小，再送到安全儲存空間。</div>
                </label>
                <input id="idCard" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                {previewUrl && (
                  <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-brand-200">
                    <Image
                      src={previewUrl}
                      alt="身分證照片預覽"
                      width={1200}
                      height={720}
                      unoptimized
                      className="w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <Button size="lg" className="mt-6 min-h-12 rounded-full bg-brand-500 px-6 text-base text-white hover:bg-brand-600" onClick={submitDocuments} disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  補件送出中...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  送出補件資料
                </span>
              )}
            </Button>
          </div>
        )}

        {stage === 'success' && (
          <div className="rounded-[2rem] border border-brand-100 bg-white/95 p-6 text-center shadow-[0_24px_70px_rgba(67,102,78,0.08)] md:p-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="mt-6 font-display text-3xl text-brand-900 md:text-4xl">補件已完成</h2>
            <p className="mt-4 text-base leading-8 text-neutral-600">顧問端已收到你的身分證字號與身分證照片，接下來會依需求進行後續確認與媒合安排。</p>
          </div>
        )}
      </div>
    </div>
  )
}
