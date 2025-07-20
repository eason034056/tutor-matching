import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebase/firebase-admin'
import { addWatermark } from '@/lib/imageUtils'

export async function POST(request: NextRequest) {
  try {
    // 處理 CORS 預檢請求
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string // 'cases' 或 'tutors'
    const subfolder = formData.get('subfolder') as string // 'id-cards' 或 'student-ids'

    if (!file || !folder || !subfolder) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      )
    }

    console.log(`開始上傳圖片到 ${folder}/${subfolder}`)

    // 添加浮水印
    const watermarkedBlob = await addWatermark(file)
    
    // 生成文件名
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = `${folder}/${subfolder}/${fileName}`

    // 轉換為 Buffer
    const arrayBuffer = await watermarkedBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上傳到 Firebase Storage
    const bucket = adminStorage.bucket()
    const fileUpload = bucket.file(filePath)
    
    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    })

    // 生成下載 URL
    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // 很長的過期時間
    })

    console.log(`圖片上傳成功: ${filePath}`)

    return NextResponse.json({
      success: true,
      url,
      fileName,
      filePath,
    })

  } catch (error) {
    console.error('圖片上傳失敗:', error)
    return NextResponse.json(
      { 
        error: '圖片上傳失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    )
  }
}

// 處理 OPTIONS 請求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 