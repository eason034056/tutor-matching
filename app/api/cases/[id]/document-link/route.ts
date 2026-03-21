import { NextResponse } from 'next/server'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

import { db } from '@/server/config/firebase'
import { createDocumentExpiryIso, generateDocumentToken, hashDocumentToken } from '@/lib/document-utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: '缺少案件 ID' }, { status: 400 })
    }

    const caseRef = doc(db, 'cases', id)
    const caseSnapshot = await getDoc(caseRef)

    if (!caseSnapshot.exists()) {
      return NextResponse.json({ error: '找不到案件資料' }, { status: 404 })
    }

    const token = generateDocumentToken()
    const expiresAt = createDocumentExpiryIso()

    await updateDoc(caseRef, {
      documentStatus: 'requested',
      documentRequestTokenHash: hashDocumentToken(token),
      documentRequestExpiresAt: expiresAt,
      documentRequestedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      token,
      path: `/case-documents/${token}`,
      expiresAt,
    })
  } catch (error) {
    console.error('Error generating case document link:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '補件連結建立失敗' },
      { status: 500 }
    )
  }
}
