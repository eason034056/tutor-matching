import { NextResponse } from 'next/server'
import { getDocs, query, where } from 'firebase/firestore'

import { tutorsCollection } from '@/server/config/firebase'
import { getPhoneTail, hashDocumentToken, isDocumentRequestExpired } from '@/lib/document-utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const { phoneTail } = await request.json()
    if (!token || !phoneTail) {
      return NextResponse.json({ error: '缺少驗證資訊' }, { status: 400 })
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

    if (getPhoneTail(tutorData.phoneNumber || '') !== String(phoneTail).trim()) {
      return NextResponse.json({ error: '電話末三碼驗證失敗' }, { status: 403 })
    }

    return NextResponse.json({
      docId: tutorDoc.id,
      tutorCode: tutorData.tutorCode || '',
      name: tutorData.name || '',
      email: tutorData.email || '',
      phoneNumber: tutorData.phoneNumber || '',
      subjects: tutorData.subjects || [],
      experience: tutorData.experience || '',
      school: tutorData.school || '',
      major: tutorData.major || '',
      expertise: tutorData.expertise || '',
      receiveNewCaseNotifications: tutorData.receiveNewCaseNotifications || false,
      studentIdCardUrl: tutorData.studentIdCardUrl || '',
      idCardUrl: tutorData.idCardUrl || '',
    })
  } catch (error) {
    console.error('Error verifying tutor resubmission link:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '驗證失敗' },
      { status: 500 }
    )
  }
}
