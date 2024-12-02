import { NextResponse } from 'next/server'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/server/config/firebase'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tutorRef = doc(db, 'tutors', params.id)
    await deleteDoc(tutorRef)
    
    return NextResponse.json({ message: '已拒絕申請' })
  } catch (error) {
    return NextResponse.json(
      { error: '操作失敗' },
      { status: 500 }
    )
  }
}
