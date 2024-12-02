import { NextResponse } from 'next/server'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/server/config/firebase'

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

    console.log('Approving case with id:', params.id)
    const caseRef = doc(db, 'cases', params.id)
    await updateDoc(caseRef, {
      pending: 'approved',
      approvedAt: new Date().toISOString()
    })
    
    return NextResponse.json({ message: '審核通過' })
  } catch (error) {
    console.error('Error approving case:', error)
    return NextResponse.json(
      { error: '審核失敗' },
      { status: 500 }
    )
  }
} 