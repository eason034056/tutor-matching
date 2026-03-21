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
    const { phoneTail } = await request.json()

    if (!token || !phoneTail) {
      return NextResponse.json({ error: '缺少驗證資訊' }, { status: 400 })
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
      documentStatus: caseData.documentStatus === 'submitted' ? 'submitted' : 'requested',
    })

    return NextResponse.json({
      success: true,
      caseNumber: caseData.caseNumber,
      parentName: caseData.parentName,
      documentStatus: caseData.documentStatus || 'requested',
    })
  } catch (error) {
    console.error('Error verifying case document link:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '驗證失敗' },
      { status: 500 }
    )
  }
}
