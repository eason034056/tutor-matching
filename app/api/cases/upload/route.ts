import { NextResponse } from 'next/server'
import { casesCollection } from '@/server/config/firebase'
import { addDoc } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    console.log('Receiving case submission...')
    const data = await request.json()
    console.log('Received case data:', data)

    // 新增到 Firebase
    const docRef = await addDoc(casesCollection, {
      ...data,
      pending: 'pending',
      createdAt: new Date().toISOString(),
    })
    
    const response = {
      success: true,
      id: docRef.id,
      ...data
    }
    console.log('Case created:', response)

    return new NextResponse(JSON.stringify(response), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error creating case:', error)
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