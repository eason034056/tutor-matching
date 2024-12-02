import { NextResponse } from 'next/server'
import { tutorsCollection } from '@/server/config/firebase'
import { getDocs, query, where } from 'firebase/firestore'

export async function GET() {
  try {
    const q = query(tutorsCollection, where("status", "==", "pending"))
    const snapshot = await getDocs(q)
    
    const pendingTutors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return NextResponse.json(pendingTutors)
  } catch (error) {
    console.error('Error fetching pending tutors:', error)
    return NextResponse.json(
      { error: '獲取待審核資料失敗' },
      { status: 500 }
    )
  }
}