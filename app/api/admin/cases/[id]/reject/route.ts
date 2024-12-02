import { NextResponse } from 'next/server'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/server/config/firebase'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caseRef = doc(db, 'cases', params.id)
    await deleteDoc(caseRef)
    
    return NextResponse.json({ message: '已拒絕案件' })
  } catch (error) {
    return NextResponse.json(
      { error: '操作失敗' },
      { status: 500 }
    )
  }
} 