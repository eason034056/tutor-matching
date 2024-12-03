import { NextResponse } from 'next/server'
import { doc, deleteDoc, getDoc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '@/server/config/firebase'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 先獲取案件資料，以取得圖片 URL
    const caseRef = doc(db, 'cases', params.id)
    const caseSnap = await getDoc(caseRef)
    
    if (!caseSnap.exists()) {
      return new NextResponse(JSON.stringify({ error: '找不到該案件' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const caseData = caseSnap.data()

    // 2. 刪除 Storage 中的身分證照片
    try {
      if (caseData.idCardUrl) {
        console.log('Deleting ID card:', caseData.idCardUrl)
        
        // 從 gs:// URL 中提取檔案路徑
        const getStoragePath = (gsUrl: string) => {
          try {
            // 移除 "gs://bucket-name/" 部分
            const path = gsUrl.replace(/^gs:\/\/[^\/]+\//, '')
            return path
          } catch (error) {
            console.error('Invalid URL:', gsUrl)
            return null
          }
        }

        const idCardPath = getStoragePath(caseData.idCardUrl)
        if (idCardPath) {
          const idCardRef = ref(storage, idCardPath)
          await deleteObject(idCardRef)
          console.log('ID card deleted successfully')
        }
      }
    } catch (error) {
      console.error('Error deleting ID card:', error)
      // 繼續執行，即使圖片刪除失敗
    }

    // 3. 刪除 Firestore 文檔
    await deleteDoc(caseRef)
    
    return new NextResponse(JSON.stringify({ 
      message: '已拒絕案件並刪除相關檔案' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error rejecting case:', error)
    return new NextResponse(JSON.stringify({ 
      error: '操作失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 