import { after } from 'next/server'
import { NextResponse } from 'next/server'

import { normalizeCase } from '@/lib/case-utils'
import { adminDb } from '@/lib/firebase/firebase-admin'
import { notifyApprovedTutors } from '@/lib/notifications/tutor-case-notification'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: docId } = await params

  if (!docId) {
    return NextResponse.json({ error: '缺少案件ID' }, { status: 400 })
  }

  const caseRef = adminDb.collection('cases').doc(docId)
  const approvedAt = new Date().toISOString()

  try {
    const caseSnapshot = await caseRef.get()
    if (!caseSnapshot.exists) {
      return NextResponse.json({ error: '找不到該案件' }, { status: 404 })
    }

    const caseData = caseSnapshot.data()!
    const normalized = normalizeCase(caseData as Parameters<typeof normalizeCase>[0])

    // 更新案件狀態為已通過
    await caseRef.update({
      pending: 'approved',
      approvedAt,
    })

    // 寫入 approvedCases 集合
    try {
      await adminDb.collection('approvedCases').add({
        caseId: caseData.id || docId,
        caseNumber: caseData.caseNumber,
        subject: caseData.subject,
        grade: caseData.grade,
        location: normalized.location,
        availableTime: caseData.availableTime,
        teacherRequirements: caseData.teacherRequirements || '',
        studentDescription: caseData.studentDescription,
        hourlyFee: caseData.hourlyFee,
        budgetRange: normalized.budgetRange,
        status: caseData.status,
        region: caseData.region,
        documentStatus: normalized.documentStatus,
        approvedAt,
      })
    } catch (error) {
      console.error('寫入 approvedCases 失敗，回滾審核狀態:', error)
      await caseRef.update({ pending: 'pending', approvedAt: null })
      throw new Error('儲存已通過案件資料失敗')
    }

    // 💡 用 Next.js after() 在回應送出後才開始寄信
    //    這樣管理員不用等郵件發完，API 立即回應
    //    after() 會保證 serverless function 不會在郵件發完前終止
    after(async () => {
      try {
        await notifyApprovedTutors({
          caseNumber: caseData.caseNumber,
          subject: caseData.subject,
          hourlyFee: caseData.hourlyFee,
          budgetRange: normalized.budgetRange,
          location: normalized.location,
          availableTime: caseData.availableTime,
          teacherRequirements: caseData.teacherRequirements,
          studentDescription: caseData.studentDescription,
        })
      } catch (notifyError) {
        console.error(`[案件通知 ${caseData.caseNumber}] after() 執行失敗:`, notifyError)
      }
    })

    return NextResponse.json({ message: '審核通過' })
  } catch (error) {
    console.error('審核案件失敗:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '審核失敗' },
      { status: 500 }
    )
  }
}
