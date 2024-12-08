import { NextResponse } from 'next/server'
import { tutorsCollection } from '@/server/config/firebase'
import { getDocs, query, where } from 'firebase/firestore'

export async function GET() {
  try {
    const tutorsSnapshot = await getDocs(
      query(tutorsCollection, where("status", "==", "pending"))
    )

    const tutors = tutorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(tutors)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: '獲取資料失敗' },
      { status: 500 }
    )
  }
}