import { NextResponse } from 'next/server'
import { tutorsCollection } from '@/server/config/firebase'
import { addDoc } from 'firebase/firestore'
import { Tutor } from '@/server/types'

export async function POST(request: Request) {
  try {
    console.log('Receiving tutor registration...')
    const data = await request.json()
    console.log('Received tutor data:', data)

    // 新增到 Firebase
    const docRef = await addDoc(tutorsCollection, {
      ...data,
      status: 'pending',
      isActive: false,
      createdAt: new Date().toISOString(),
    })
    
    const response = {
      success: true,
      id: docRef.id,
      ...data
    }
    console.log('Tutor registration created:', response)

    return new NextResponse(JSON.stringify(response), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error creating tutor registration:', error)
    return new NextResponse(JSON.stringify({ 
      error: '提交失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}