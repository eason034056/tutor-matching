import { NextResponse } from 'next/server'
import { getDocs, query, updateDoc, where } from 'firebase/firestore'

import { casesCollection } from '@/server/config/firebase'
import { getPhoneTail, hashDocumentToken, isDocumentRequestExpired } from '@/lib/document-utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { phoneTail, idNumber, idCardUrl } = body

    if (!token || !phoneTail || !idNumber || !idCardUrl) {
      return NextResponse.json({ error: '缺少補件資料' }, { status: 400 })
    }

    const tokenHash = hashDocumentToken(token)
    const result = await getDocs(query(casesCollection, where('documentRequestTokenHash', '==', tokenHash)))

    if (result.empty) {
      return NextResponse.json({ error: '補件連結無效' }, { status: 404 })
    }

    const caseDoc = result.docs[0]
    const caseData = caseDoc.data()

    if (isDocumentRequestExpired(caseData.documentRequestExpiresAt)) {
      return NextResponse.json({ error: '補件連結已過期' }, { status: 410 })
    }

    if (getPhoneTail(caseData.parentPhone || '') !== String(phoneTail).trim()) {
      return NextResponse.json({ error: '電話末三碼驗證失敗' }, { status: 401 })
    }

    await updateDoc(caseDoc.ref, {
      idNumber,
      idCardUrl,
      documentStatus: 'submitted',
      documentSubmittedAt: new Date().toISOString(),
      documentRequestTokenHash: null,
      documentRequestExpiresAt: null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting case documents:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '補件失敗' },
      { status: 500 }
    )
  }
}
