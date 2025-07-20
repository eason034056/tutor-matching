import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/lib/firebase/firebase-admin'
import { addWatermark } from '@/lib/imageUtils.server'

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

    console.log('開始處理圖片上傳請求...')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string // 'cases' 或 'tutors'
    const subfolder = formData.get('subfolder') as string // 'id-cards' 或 'student-ids'

    console.log('收到的參數:', { folder, subfolder, fileName: file?.name })

    if (!file || !folder || !subfolder) {
      console.error('缺少必要參數:', { file: !!file, folder, subfolder })
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      )
    }

    console.log(`開始上傳圖片到 ${folder}/${subfolder}`)

    // 將 File 對象轉換為 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 添加浮水印
    console.log('開始添加浮水印...')
    const watermarkedBuffer = await addWatermark(buffer)
    console.log('浮水印添加完成')
    
    // 生成文件名
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = `${folder}/${subfolder}/${fileName}`
    console.log('準備上傳文件:', filePath)

    // 上傳到 Firebase Storage
    console.log('開始上傳到 Firebase Storage...')
    const bucket = adminStorage.bucket()
    console.log('Storage bucket 名稱:', bucket.name)
    
    // 檢查 bucket 是否存在
    try {
      const [exists] = await bucket.exists()
      console.log('Bucket 是否存在:', exists)
      
      if (!exists) {
        console.error('Bucket 不存在，嘗試使用預設 bucket...')
        // 嘗試使用預設的 bucket 名稱
        const defaultBucket = adminStorage.bucket(`${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebasestorage.app`)
        console.log('嘗試使用預設 bucket:', defaultBucket.name)
        
        const [defaultExists] = await defaultBucket.exists()
        console.log('預設 bucket 是否存在:', defaultExists)
        
        if (defaultExists) {
          const fileUpload = defaultBucket.file(filePath)
          await fileUpload.save(watermarkedBuffer, {
            metadata: {
              contentType: file.type,
            },
          })
          console.log('文件上傳完成（使用預設 bucket）')
          
          // 生成下載 URL
          const [url] = await fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-01-2500',
          })
          
          return NextResponse.json({
            success: true,
            url,
            fileName,
            filePath,
          })
        } else {
          throw new Error('預設 bucket 也不存在')
        }
      }
    } catch (bucketError) {
      console.error('檢查 bucket 失敗:', bucketError)
    }
    
    const fileUpload = bucket.file(filePath)
    
    await fileUpload.save(watermarkedBuffer, {
      metadata: {
        contentType: file.type,
      },
    })
    console.log('文件上傳完成')

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
    console.error('錯誤詳情:', {
      message: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // 檢查環境變數
    console.log('環境變數檢查:', {
      hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })

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