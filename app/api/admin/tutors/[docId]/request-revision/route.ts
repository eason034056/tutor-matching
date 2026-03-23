import { NextResponse } from 'next/server'

import { createDocumentExpiryIso, generateDocumentToken, hashDocumentToken } from '@/lib/document-utils'
import { adminDb } from '@/lib/firebase/firebase-admin'
import {
  buildTutorRevisionRequestNotificationData,
  sendTutorRevisionRequestEmail,
  validateTutorRevisionRequest,
} from '@/lib/notifications/tutor-review'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params

  if (!docId) {
    return NextResponse.json({ error: '缺少教師文件 ID' }, { status: 400 })
  }

  const tutorRef = adminDb.collection('tutors').doc(docId)
  let shouldRollback = false

  try {
    const body = await request.json()
    const { reasonCodes, note } = validateTutorRevisionRequest({
      reasonCodes: body.reasonCodes,
      note: body.note,
    })

    const tutorSnapshot = await tutorRef.get()
    if (!tutorSnapshot.exists) {
      return NextResponse.json({ error: '找不到該教師' }, { status: 404 })
    }

    const tutorData = tutorSnapshot.data() || {}
    if (!tutorData.email) {
      return NextResponse.json({ error: '教師缺少 email，無法寄送補件通知' }, { status: 400 })
    }

    const token = generateDocumentToken()
    const expiresAt = createDocumentExpiryIso()
    const revisionRequestedAt = new Date().toISOString()

    await tutorRef.update({
      status: 'revision_requested',
      revisionReasonCodes: reasonCodes,
      revisionNote: note,
      revisionRequestedAt,
      revisionTokenHash: hashDocumentToken(token),
      revisionExpiresAt: expiresAt,
      revisionSubmittedAt: null,
    })
    shouldRollback = true

    const notification = buildTutorRevisionRequestNotificationData(
      {
        name: tutorData.name,
        revisionReasonCodes: reasonCodes,
        revisionNote: note,
        revisionPath: `/tutor-resubmission/${token}`,
        revisionExpiresAt: expiresAt,
      },
      { siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://tutor-matching.tw' }
    )

    await sendTutorRevisionRequestEmail({
      recipientEmail: tutorData.email,
      notification,
    })
    shouldRollback = false

    return NextResponse.json({ message: '已寄出補件通知', expiresAt })
  } catch (error) {
    if (error instanceof Error && ['請至少選擇一個退件理由', '請補充退件說明'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (shouldRollback) {
      await tutorRef.update({
        status: 'pending',
        revisionReasonCodes: [],
        revisionNote: '',
        revisionRequestedAt: null,
        revisionTokenHash: null,
        revisionExpiresAt: null,
        revisionSubmittedAt: null,
      }).catch(() => null)
    }

    console.error('Error requesting tutor revision:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '退回補件失敗' },
      { status: 500 }
    )
  }
}
