import { NextResponse } from 'next/server'
import { deleteDoc, getDocs, query, where } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { casesCollection, storage } from '@/server/config/firebase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('Received tutor approval request for ID:', resolvedParams.id)
    const q = query(casesCollection, where('id', '==', resolvedParams.id))
    console.log('Query:', q)
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return NextResponse.json({ error: '找不到該案件' }, { status: 404 })
    }
    
    const caseDoc = querySnapshot.docs[0]
    const caseData = caseDoc.data()
    const caseRef = caseDoc.ref

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
            console.error('Invalid URL:', gsUrl + ' ' + error)
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