import { NextResponse } from 'next/server'
import { casesCollection } from '@/server/config/firebase'
import { addDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { buildLocationSummary } from '@/lib/address-utils'
import { notifyNewCaseAdmins } from '@/lib/notifications/admin-case-review'

export async function POST(request: Request) {
  try {
    console.log('Receiving case submission...')
    const data = await request.json()
    console.log('Received case data:', data)

    const lessonMode = data.lessonMode ?? (data.region === '線上' ? 'online' : 'in_person')
    const locationSummary =
      typeof data.location === 'string' && data.location.trim()
        ? data.location.trim()
        : buildLocationSummary({
            city: data.city,
            district: data.district,
            roadName: data.roadName,
            landmark: data.landmark,
            lessonMode,
            onlineDetail: data.onlineDetail,
          })

    const normalizedCaseData = {
      ...data,
      address:
        locationSummary ||
        (typeof data.address === 'string' && data.address.trim() ? data.address.trim() : undefined),
      hourlyFee:
        typeof data.hourlyFee === 'string' && data.hourlyFee.trim()
          ? data.hourlyFee.trim()
          : typeof data.budgetRange === 'string'
            ? data.budgetRange.trim()
            : data.hourlyFee,
    }

    if ('budgetRange' in normalizedCaseData) {
      delete normalizedCaseData.budgetRange
    }

    // 產生唯一ID
    const uniqueId = uuidv4() as string & { readonly brand: unique symbol }
    const caseRecord = {
      ...normalizedCaseData,
      id: uniqueId,
      pending: 'pending',
      documentStatus: normalizedCaseData.documentStatus || 'not_requested',
      createdAt: new Date().toISOString(),
    }

    // 新增到 Firebase
    const docRef = await addDoc(casesCollection, caseRecord)

    console.log('Case created:', docRef)

    try {
      await notifyNewCaseAdmins(caseRecord)
    } catch (notificationError) {
      console.error('Error notifying admins about new case:', notificationError)
    }
    
    const response = {
      success: true,
      id: uniqueId,
      ...normalizedCaseData
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
