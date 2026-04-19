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

    // 💡 BCC 發送只需 ~1-2 秒，改為同步寄信再回應
    //    保證 email 一定寄出，不受瀏覽器關閉影響
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
      // ⚠️ 寄信失敗不影響審核結果（案件狀態已寫入 DB）
      console.error(`[案件通知 ${caseData.caseNumber}] 發送失敗:`, notifyError)
    }

    return NextResponse.json({ message: '審核通過' })
  } catch (error) {
    console.error('審核案件失敗:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '審核失敗' },
      { status: 500 }
    )
  }
}
