import { NextResponse } from 'next/server'
import { casesCollection } from '@/server/config/firebase'
import { addDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    console.log('Receiving case submission...')
    const data = await request.json()
    console.log('Received case data:', data)

    // 產生唯一ID
    const uniqueId = uuidv4() as string & { readonly brand: unique symbol }

    // 新增到 Firebase
    const docRef = await addDoc(casesCollection, {
      ...data,
      id: uniqueId,
      pending: 'pending', 
      createdAt: new Date().toISOString(),
    })

    console.log('Case created:', docRef)
    
    const response = {
      success: true,
      id: uniqueId,
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