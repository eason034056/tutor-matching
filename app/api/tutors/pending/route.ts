import { NextResponse } from 'next/server'
import { tutorsCollection } from '@/server/config/firebase'
import { addDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    console.log('Receiving tutor registration...')
    const data = await request.json()
    console.log('Received tutor data:', data)

    // 產生唯一ID
    const uniqueId = uuidv4() as string & { readonly brand: unique symbol }

    // 新增到 Firebase
    const docRef = await addDoc(tutorsCollection, {
      ...data,
      id: uniqueId,
      status: 'pending',
      isActive: false,
      createdAt: new Date().toISOString(),
    })
    
    console.log('Tutor registration created:', docRef)
    
    const response = {
      success: true,
      id: uniqueId,
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