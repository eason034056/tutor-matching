import { NextResponse } from 'next/server'
import { getDocs, query, updateDoc, where } from 'firebase/firestore'

import { tutorsCollection } from '@/server/config/firebase'
import { getPhoneTail, hashDocumentToken, isDocumentRequestExpired } from '@/lib/document-utils'
import { normalizeTutorSubmissionData } from '@/lib/tutor-form'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const body = await request.json()
    const phoneTail = String(body.phoneTail || '').trim()
    if (!token || !phoneTail) {
      return NextResponse.json({ error: '缺少補件資訊' }, { status: 400 })
    }

    const result = await getDocs(query(tutorsCollection, where('revisionTokenHash', '==', hashDocumentToken(token))))
    if (result.empty) {
      return NextResponse.json({ error: '補件連結無效' }, { status: 404 })
    }

    const tutorDoc = result.docs[0]
    const tutorData = tutorDoc.data()

    if (isDocumentRequestExpired(tutorData.revisionExpiresAt)) {
      return NextResponse.json({ error: '補件連結已過期' }, { status: 410 })
    }

    if (getPhoneTail(tutorData.phoneNumber || '') !== phoneTail) {
      return NextResponse.json({ error: '電話末三碼驗證失敗' }, { status: 403 })
    }

    const normalizedData = normalizeTutorSubmissionData(body)
    const studentIdCardUrl = String(body.studentIdCardUrl || tutorData.studentIdCardUrl || '').trim()
    const idCardUrl = String(body.idCardUrl || tutorData.idCardUrl || '').trim()

    if (!studentIdCardUrl || !idCardUrl) {
      return NextResponse.json({ error: '請提供完整證件照片' }, { status: 400 })
    }

    await updateDoc(tutorDoc.ref, {
      ...normalizedData,
      studentIdCardUrl,
      idCardUrl,
      status: 'pending',
      isActive: false,
      revisionReasonCodes: [],
      revisionNote: '',
      revisionRequestedAt: null,
      revisionTokenHash: null,
      revisionExpiresAt: null,
      revisionSubmittedAt: new Date().toISOString(),
      approvedAt: null,
    })

    return NextResponse.json({ message: '已重新送出申請' })
  } catch (error) {
    console.error('Error submitting tutor resubmission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '補件送出失敗' },
      { status: 500 }
    )
  }
}
