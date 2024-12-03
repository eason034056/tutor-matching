import { NextResponse } from 'next/server'
import { doc, deleteDoc, getDoc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '@/server/config/firebase'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 先獲取文檔資料，以取得圖片 URL
    const tutorRef = doc(db, 'tutors', params.id)
    const tutorSnap = await getDoc(tutorRef)
    
    if (!tutorSnap.exists()) {
      return new NextResponse(JSON.stringify({ error: '找不到該申請' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const tutorData = tutorSnap.data()

    // 2. 刪除 Storage 中的圖片
    try {
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

      if (tutorData.studentIdCardUrl) {
        console.log('Deleting student ID:', tutorData.studentIdCardUrl)
        const studentIdPath = getStoragePath(tutorData.studentIdCardUrl)
        if (studentIdPath) {
          const studentIdRef = ref(storage, studentIdPath)
          await deleteObject(studentIdRef)
          console.log('Student ID deleted successfully')
        }
      }

      if (tutorData.idCardUrl) {
        console.log('Deleting ID card:', tutorData.idCardUrl)
        const idCardPath = getStoragePath(tutorData.idCardUrl)
        if (idCardPath) {
          const idCardRef = ref(storage, idCardPath)
          await deleteObject(idCardRef)
          console.log('ID card deleted successfully')
        }
      }
    } catch (error) {
      console.error('Error deleting images:', error)
      // 繼續執行，即使圖片刪除失敗
    }

    // 3. 刪除 Firestore 文檔
    await deleteDoc(tutorRef)
    
    return new NextResponse(JSON.stringify({ 
      message: '已拒絕申請並刪除相關檔案' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error rejecting tutor:', error)
    return new NextResponse(JSON.stringify({ 
      error: '操作失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
