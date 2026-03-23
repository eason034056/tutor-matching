import { NextResponse } from 'next/server'

import { adminDb } from '@/lib/firebase/firebase-admin'
import {
  buildTutorApprovalNotificationData,
  sendTutorApprovalEmail,
} from '@/lib/notifications/tutor-review'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params

  if (!docId) {
    return NextResponse.json({ error: '缺少教師文件 ID' }, { status: 400 })
  }

  const tutorRef = adminDb.collection('tutors').doc(docId)
  const approvedTutorRef = adminDb.collection('approvedTutors').doc(docId)
  const approvedAt = new Date().toISOString()

  try {
    const tutorSnapshot = await tutorRef.get()
    if (!tutorSnapshot.exists) {
      return NextResponse.json({ error: '找不到該教師' }, { status: 404 })
    }

    const tutorData = tutorSnapshot.data() || {}
    const requiredFields = ['experience', 'expertise', 'major', 'name', 'school', 'subjects', 'email', 'tutorCode'] as const
    const missingFields = requiredFields.filter((field) => !tutorData[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `教師資料不完整，缺少: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    await tutorRef.update({
      status: 'approved',
      isActive: true,
      approvedAt,
      revisionReasonCodes: [],
      revisionNote: '',
      revisionRequestedAt: null,
      revisionTokenHash: null,
      revisionExpiresAt: null,
      revisionSubmittedAt: null,
    })

    await approvedTutorRef.set({
      tutorId: tutorData.id || docId,
      tutorCode: tutorData.tutorCode,
      experience: tutorData.experience,
      expertise: tutorData.expertise,
      major: tutorData.major,
      name: tutorData.name,
      email: tutorData.email,
      school: tutorData.school,
      subjects: tutorData.subjects,
      approvedAt,
      receiveNewCaseNotifications: tutorData.receiveNewCaseNotifications || false,
    })

    const notification = buildTutorApprovalNotificationData(
      {
        name: tutorData.name,
        tutorCode: tutorData.tutorCode,
        receiveNewCaseNotifications: tutorData.receiveNewCaseNotifications,
      },
      { siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://tutor-matching.tw' }
    )

    await sendTutorApprovalEmail({
      recipientEmail: tutorData.email,
      notification,
    })

    return NextResponse.json({ message: '審核通過' })
  } catch (error) {
    await tutorRef.update({
      status: 'pending',
      isActive: false,
      approvedAt: null,
    }).catch(() => null)
    await approvedTutorRef.delete().catch(() => null)

    console.error('Error approving tutor:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '審核失敗' },
      { status: 500 }
    )
  }
}
