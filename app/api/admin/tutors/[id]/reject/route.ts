import { NextResponse } from 'next/server'
import { where, query, getDocs, deleteDoc, getDoc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { storage, tutorsCollection } from '@/server/config/firebase'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Received tutor rejection request for ID:', params.id)
    const q = query(tutorsCollection, where('id', '==', params.id))
    console.log('Query:', q)
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return NextResponse.json({ error: '找不到該教師' }, { status: 404 })
    }

    const tutorRef = querySnapshot.docs[0].ref
    const tutorSnap = await getDoc(tutorRef)
    
    if (!tutorSnap.exists()) {
      return NextResponse.json({ error: '找不到該申請' }, { status: 404 })
    }

    const tutorData = tutorSnap.data()

    try {
      const getStoragePath = (gsUrl: string) => {
        try {
          const path = gsUrl.replace(/^gs:\/\/[^\/]+\//, '')
          return path
        } catch (error) {
          console.error('Invalid URL:', gsUrl + ' ' + error)
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
    }

    // 從資料庫中刪除文檔
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
