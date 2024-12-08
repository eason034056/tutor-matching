import { NextResponse } from 'next/server'
import { updateDoc, query, getDocs, where, addDoc } from 'firebase/firestore'
import { casesCollection, approvedCasesCollection } from '@/server/config/firebase'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      console.error('No case ID provided')
      return NextResponse.json(
        { error: '缺少案件ID' },
        { status: 400 }
      )
    }
    console.log('Received tutor approval request for ID:', params.id)
    const q = query(casesCollection, where('id', '==', params.id))
    console.log('Query:', q)
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return NextResponse.json({ error: '找不到該案件' }, { status: 404 })
    }
    
    const caseDoc = querySnapshot.docs[0]
    const caseData = caseDoc.data()
    const caseRef = caseDoc.ref

    console.log('Approving case with id:', params.id)
    await updateDoc(caseRef, {
      pending: 'approved',
      approvedAt: new Date().toISOString()
    })

    try {
      // Store approved case info in approvedCasesCollection
      await addDoc(approvedCasesCollection, {
        caseId: params.id,
        caseNumber: caseData.caseNumber,
        subject: caseData.subject,
        grade: caseData.grade,
        location: caseData.location,
        availableTime: caseData.availableTime,
        studentDescription: caseData.studentDescription,
        teacherRequirements: caseData.teacherRequirements,
        hourlyFee: caseData.hourlyFee,
        status: caseData.status,
        approvedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error storing approved case data:', error)
      // Revert the approval if storing data fails
      await updateDoc(caseRef, {
        pending: 'pending',
        approvedAt: null
      })
      throw new Error('Failed to store approved case data')
    }
    
    return NextResponse.json({ message: '審核通過' })
  } catch (error) {
    console.error('Error approving case:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '審核失敗' },
      { status: 500 }
    )
  }
} 