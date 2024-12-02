import { NextResponse } from 'next/server'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/server/config/firebase'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tutorRef = doc(db, 'tutors', params.id)
    await updateDoc(tutorRef, {
      status: 'approved',
      isActive: true,
      approvedAt: new Date().toISOString()
    })
    
    return NextResponse.json({ message: '審核通過' })
  } catch (error) {
    return NextResponse.json(
      { error: '審核失敗' },
      { status: 500 }
    )
  }
}