import { NextResponse } from 'next/server'
import { casesCollection } from '@/server/config/firebase'
import { getDocs, query, where } from 'firebase/firestore'
import { TutorCase } from '@/server/types'

export async function GET() {
  try {
    console.log('Fetching pending cases...')
    
    const q = query(casesCollection, where("pending", "==", "pending"))
    const snapshot = await getDocs(q)
    
    const pendingCases = snapshot.docs.map(doc => {
      const data = doc.data() as TutorCase
      return {
        ...data,
        id: doc.id
      }
    })
    
    console.log(`Found ${pendingCases.length} pending cases`)
    
    return new NextResponse(JSON.stringify(pendingCases), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error fetching pending cases:', error)
    return new NextResponse(JSON.stringify({ 
      error: '獲取待審核案件失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
} 