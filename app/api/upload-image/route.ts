import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebase/firebase-admin'
import { addWatermark } from '@/lib/imageUtils'

export async function POST(request: NextRequest) {
  try {
    console.log('開始處理圖片上傳請求...')
    
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

    console.log('接收到的參數:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      folder, 
      subfolder 
    })

    if (!file || !folder || !subfolder) {
      console.error('缺少必要參數:', { hasFile: !!file, folder, subfolder })
      return NextResponse.json(
        { error: '缺少必要參數', details: '請確保提供了文件、文件夾和子文件夾參數' },
        { status: 400 }
      )
    }

    console.log(`開始上傳圖片到 ${folder}/${subfolder}`)

    // 添加浮水印
    console.log('開始添加浮水印...')
    const watermarkedBlob = await addWatermark(file)
    console.log('浮水印添加完成')
    
    // 生成文件名
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = `${folder}/${subfolder}/${fileName}`

    console.log('文件路徑:', filePath)

    // 轉換為 Buffer
    console.log('轉換文件為 Buffer...')
    const arrayBuffer = await watermarkedBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('Buffer 轉換完成，大小:', buffer.length)

    // 上傳到 Firebase Storage
    console.log('開始上傳到 Firebase Storage...')
    const bucket = adminStorage.bucket()
    const fileUpload = bucket.file(filePath)
    
    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    })
    console.log('文件保存到 Storage 完成')

    // 生成下載 URL
    console.log('生成下載 URL...')
    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // 很長的過期時間
    })

    console.log(`圖片上傳成功: ${filePath}`)
    console.log('下載 URL:', url)

    return NextResponse.json({
      success: true,
      url,
      fileName,
      filePath,
    })

  } catch (error) {
    console.error('圖片上傳失敗:', error)
    
    // 提供更詳細的錯誤信息
    let errorMessage = '圖片上傳失敗'
    let errorDetails = '未知錯誤'
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || '無堆疊信息'
    }
    
    console.error('錯誤詳情:', {
      message: errorMessage,
      details: errorDetails,
      error: error
    })

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
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