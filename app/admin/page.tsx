'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChanged, User, signOut } from 'firebase/auth'
import LoginForm from '@/components/auth/LoginForm'
import { auth, db, storage } from '@/server/config/firebase'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Tutor, TutorCase } from '@/server/types'
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc } from 'firebase/firestore'
import { ref } from 'firebase/storage'
import { deleteObject } from 'firebase/storage'
import Image from 'next/image'

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [pendingTutors, setPendingTutors] = useState<(Tutor & { docId: string })[]>([])
  const [pendingCases, setPendingCases] = useState<(TutorCase & { docId: string })[]>([])
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [inactiveTime, setInactiveTime] = useState(0)

  const fetchPendingData = async () => {
    try {
      // 確保用戶已登入
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.error('請先登入');
        return;
      }

      console.log('開始載入待審核資料...')

      // 使用 Firestore 查詢
      const tutorsQuery = query(collection(db, 'tutors'), where('status', '==', 'pending'));
      const casesQuery = query(collection(db, 'cases'), where('pending', '==', 'pending'));
      
      const [tutorsSnapshot, casesSnapshot] = await Promise.all([
        getDocs(tutorsQuery),
        getDocs(casesQuery)
      ]);

      const tutors = tutorsSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          ...data,
          docId: doc.id, // Firestore 文檔 ID
          id: data.id || doc.id // 保留原始 ID，如果沒有則使用文檔 ID
        }
      }) as (Tutor & { docId: string })[];

      const cases = casesSnapshot.docs.map(doc => {
        const data = doc.data()
        console.log('案件資料:', { docId: doc.id, customId: data.id, caseNumber: data.caseNumber })
        return {
          ...data,
          docId: doc.id, // Firestore 文檔 ID  
          id: data.id || doc.id // 保留原始 ID，如果沒有則使用文檔 ID
        }
      }) as (TutorCase & { docId: string })[];

      console.log('載入完成:', { tutors: tutors.length, cases: cases.length })
      setPendingTutors(tutors);
      setPendingCases(cases);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('載入失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  };

  // 監聽使用者登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      if (user) {
        fetchPendingData()
      }
    })

    return () => unsubscribe()
  }, [])

  // 自動登出計時器
  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    const updateLastActivity = () => {
      setLastActivity(Date.now())
    }

    // 監聽使用者活動
    window.addEventListener('mousemove', updateLastActivity)
    window.addEventListener('keydown', updateLastActivity)
    window.addEventListener('click', updateLastActivity)

    // 每秒更新閒置時間
    const updateInterval = setInterval(() => {
      const now = Date.now()
      const inactive = now - lastActivity
      setInactiveTime(inactive)
      
      if (inactive > 10 * 60 * 1000) { // 10分鐘
        handleLogout()
        toast.info('因閒置過久，系統已自動登出')
      }
    }, 1000)

    return () => {
      window.removeEventListener('mousemove', updateLastActivity)
      window.removeEventListener('keydown', updateLastActivity)
      window.removeEventListener('click', updateLastActivity)
      clearInterval(updateInterval)
    }
  }, [user, lastActivity])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('已登出')
    } catch (error) {
      console.error('登出失敗: ', error)
      toast.error('登出失敗')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-screen">
        <p>載入中...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">管理員登入</CardTitle>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // 處理教師審核
  const handleTutorApprove = async (docId: string) => {
    if (processing) return
    setProcessing(true)
    
    try {
      console.log('開始審核教師，文檔 ID:', docId)
      
      if (!docId) {
        throw new Error('教師ID無效')
      }

      // 直接使用文檔 ID 獲取教師
      const tutorRef = doc(db, 'tutors', docId);
      const tutorSnapshot = await getDoc(tutorRef);
      
      if (!tutorSnapshot.exists()) {
        throw new Error('找不到該教師')
      }
      
      const tutorData = tutorSnapshot.data();
      console.log('找到教師資料:', tutorData)

      // Validate required fields
      const requiredFields = ['experience', 'expertise', 'major', 'name', 'school', 'subjects'];
      const missingFields = requiredFields.filter(field => !tutorData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`教師資料不完整，缺少: ${missingFields.join(', ')}`);
      }

      await updateDoc(tutorRef, {
        status: 'approved',
        isActive: true,
        approvedAt: new Date().toISOString()
      });

      // Store approved tutor info in approvedTutors collection
      await addDoc(collection(db, 'approvedTutors'), {
        tutorId: docId,
        experience: tutorData.experience,
        subjects: tutorData.subjects,
        expertise: tutorData.expertise,
        major: tutorData.major,
        name: tutorData.name,
        school: tutorData.school,
        approvedAt: new Date().toISOString()
      });
      
      toast.success('審核通過')
      await fetchPendingData()
    } catch (error) {
      console.error('Error approving tutor:', error);
      toast.error(error instanceof Error ? error.message : '審核失敗')
    } finally {
      setProcessing(false)
    }
  }

  // 處理家教拒絕
  const handleTutorReject = async (docId: string) => {
    if (processing) return
    setProcessing(true)
    
    try {
      console.log('開始拒絕教師，文檔 ID:', docId)
      
      if (!docId) {
        throw new Error('教師ID無效')
      }

      // 直接使用文檔 ID 獲取教師
      const tutorRef = doc(db, 'tutors', docId);
      const tutorSnapshot = await getDoc(tutorRef);
      
      if (!tutorSnapshot.exists()) {
        throw new Error('找不到該教師')
      }
      
      const tutorData = tutorSnapshot.data();
      console.log('找到教師資料:', tutorData)

      // Delete ID card images from storage
      if (tutorData.idCardUrl) {
        try {
          console.log('刪除身分證照片:', tutorData.idCardUrl)
          const getStoragePath = (url: string) => {
            try {
              if (url.startsWith('gs://')) {
                return url.replace(/^gs:\/\/[^\/]+\//, '')
              }
              const urlObj = new URL(url)
              const pathMatch = urlObj.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)/)
              return pathMatch ? decodeURIComponent(pathMatch[1]) : null
            } catch (error) {
              console.error('解析 URL 失敗:', error)
              return null
            }
          }
          const storagePath = getStoragePath(tutorData.idCardUrl)
          if (storagePath) {
            const idCardRef = ref(storage, storagePath);
            await deleteObject(idCardRef);
            console.log('身分證照片已刪除')
          }
        } catch (error) {
          console.error('Error deleting ID card:', error);
        }
      }

      // Delete student ID photo if exists  
      if (tutorData.studentIdCardUrl) {
        try {
          console.log('刪除學生證照片:', tutorData.studentIdCardUrl)
          const getStoragePath = (url: string) => {
            try {
              if (url.startsWith('gs://')) {
                return url.replace(/^gs:\/\/[^\/]+\//, '')
              }
              const urlObj = new URL(url)
              const pathMatch = urlObj.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)/)
              return pathMatch ? decodeURIComponent(pathMatch[1]) : null
            } catch (error) {
              console.error('解析 URL 失敗:', error)
              return null
            }
          }
          const storagePath = getStoragePath(tutorData.studentIdCardUrl)
          if (storagePath) {
            const studentIdRef = ref(storage, storagePath);
            await deleteObject(studentIdRef);
            console.log('學生證照片已刪除')
          }
        } catch (error) {
          console.error('Error deleting student ID:', error);
        }
      }
      
      await deleteDoc(tutorRef)
      
      toast.success('已拒絕申請')
      await fetchPendingData()
    } catch (error) {
      console.error('拒絕教師失敗:', error)
      toast.error(`操作失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setProcessing(false)
    }
  }

  // 處理案件審核
  const handleCaseApprove = async (docId: string) => {
    if (processing) return
    setProcessing(true)
    
    try {
      console.log('開始審核案件，文檔 ID:', docId)
      
      if (!docId) {
        throw new Error('案件ID無效')
      }

      // 直接使用文檔 ID 獲取案件
      const caseRef = doc(db, 'cases', docId);
      const caseSnapshot = await getDoc(caseRef);
      
      if (!caseSnapshot.exists()) {
        throw new Error('找不到該案件')
      }
      
      const caseData = caseSnapshot.data();
      console.log('找到案件資料:', caseData)

      // 更新案件狀態
      await updateDoc(caseRef, {
        pending: 'approved',
        approvedAt: new Date().toISOString()
      });

      console.log('案件狀態已更新為 approved')

      // 將審核通過的案件加入 approvedCases 集合
      const approvedCaseData = {
        caseId: docId,
        caseNumber: caseData.caseNumber,
        subject: caseData.subject,
        grade: caseData.grade,
        location: caseData.location,
        availableTime: caseData.availableTime,
        teacherRequirements: caseData.teacherRequirements,
        studentDescription: caseData.studentDescription,
        hourlyFee: caseData.hourlyFee,
        status: caseData.status,
        region: caseData.region,
        approvedAt: new Date().toISOString()
      }

      await addDoc(collection(db, 'approvedCases'), approvedCaseData);
      console.log('已加入 approvedCases 集合')

      toast.success('案件已通過審核')
      await fetchPendingData()
    } catch (error) {
      console.error('Error approving case:', error)
      toast.error(`審核失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setProcessing(false)
    }
  }

  // 處理案件拒絕
  const handleCaseReject = async (docId: string) => {
    if (processing) return
    setProcessing(true)
    
    try {
      console.log('開始拒絕案件，文檔 ID:', docId)
      
      if (!docId) {
        throw new Error('案件ID無效')
      }

      // 直接使用文檔 ID 獲取案件
      const caseRef = doc(db, 'cases', docId);
      const caseSnapshot = await getDoc(caseRef);
      
      if (!caseSnapshot.exists()) {
        throw new Error('找不到該案件')
      }
      
      const caseData = caseSnapshot.data();
      console.log('找到案件資料:', caseData)

      // 刪除 storage 中的身分證照片
      if (caseData.idCardUrl) {
        try {
          console.log('刪除身分證照片:', caseData.idCardUrl)
          
          // 從 URL 中提取檔案路徑
          const getStoragePath = (url: string) => {
            try {
              // 如果是 gs:// URL
              if (url.startsWith('gs://')) {
                return url.replace(/^gs:\/\/[^\/]+\//, '')
              }
              // 如果是 https:// URL，需要解析
              const urlObj = new URL(url)
              const pathMatch = urlObj.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)/)
              return pathMatch ? decodeURIComponent(pathMatch[1]) : null
            } catch (error) {
              console.error('解析 URL 失敗:', error)
              return null
            }
          }

          const storagePath = getStoragePath(caseData.idCardUrl)
          if (storagePath) {
            const imageRef = ref(storage, storagePath)
            await deleteObject(imageRef)
            console.log('身分證照片已刪除')
          }
        } catch (error) {
          console.error('刪除身分證照片失敗:', error)
          // 繼續執行，即使照片刪除失敗
        }
      }

      // 刪除案件文檔
      await deleteDoc(caseRef);
      console.log('案件文檔已刪除')
      
      toast.success('已拒絕案件')
      await fetchPendingData()
    } catch (error) {
      console.error('拒絕案件失敗:', error)
      toast.error(`操作失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">管理員後台</h1>
        </div>
        <div className="flex flex-row items-center gap-2">
          <p className="text-sm text-gray-500">
            閒置時間: {Math.floor(inactiveTime / 1000)} 秒
          </p>
        <Button variant="outline" onClick={handleLogout}>
            登出
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="tutors">
        <TabsList>
          <TabsTrigger value="tutors">
            待審核教師
            {pendingTutors.length > 0 && (
              <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                {pendingTutors.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cases">
            待審核案件
            {pendingCases.length > 0 && (
              <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                {pendingCases.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutors">
          <Card>
            <CardHeader>
              <CardTitle>待審核教師列表</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingTutors.map((tutor) => (
                <div key={tutor.id} className="border p-4 rounded mb-4">
                  <h3 className="font-bold">{tutor.name}</h3>
                  <p>電話：{tutor.phoneNumber}</p>
                  <p>科目：{tutor.subjects.join(', ')}</p>
                  <p>經驗：{tutor.experience}</p>
                  <p>學校：{tutor.school}</p>
                  <p>專長：{tutor.expertise}</p>
                  <p>學位：{tutor.major}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-semibold mb-2">學生證</h4>
                      <Image
                        src={tutor.studentIdCardUrl} 
                        alt="學生證" 
                        width={500}
                        height={300}
                        className="w-full rounded-lg shadow-md"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">身分證</h4>
                      <Image
                        src={tutor.idCardUrl} 
                        alt="身分證" 
                        width={500}
                        height={300}
                        className="w-full rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        console.log('點擊拒絕教師按鈕，教師 ID:', tutor.id, '文檔 ID:', tutor.docId)
                        handleTutorReject(tutor.docId) // 使用 docId
                      }}
                      disabled={processing}
                    >
                      {processing ? '處理中...' : '不通過'}
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('點擊通過教師按鈕，教師 ID:', tutor.id, '文檔 ID:', tutor.docId)
                        handleTutorApprove(tutor.docId) // 使用 docId
                      }}
                      disabled={processing}
                    >
                      {processing ? '處理中...' : '通過審核'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardHeader>
              <CardTitle>
                待審核案件列表 
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (共 {pendingCases.length} 件)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingCases.length === 0 ? (
                <p className="text-center text-gray-500 py-8">目前沒有待審核的案件</p>
              ) : (
                pendingCases.map((case_) => (
                  <div key={case_.id} className="border p-4 rounded mb-4">
                    <h3 className="font-bold">案件編號：{case_.caseNumber}</h3>
                    <div className="text-xs text-gray-500 mb-2">
                      文檔 ID: {case_.docId} | 自定義 ID: {case_.id || '無'}
                    </div>
                    <div className="grid grid-cols-2 gap-4 my-2">
                      <p>家長：{case_.parentName}</p>
                      <p>電話：{case_.parentPhone}</p>
                      <p>科目：{case_.subject}</p>
                      <p>時薪：${case_.hourlyFee}</p>
                    </div>
                    <p>地點：{case_.location}</p>
                    <p>時段：{case_.availableTime}</p>
                    {case_.idCardUrl && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">身分證照片</h4>
                        <Image
                          src={case_.idCardUrl} 
                          alt="身分證" 
                          width={500}
                          height={300}
                          className="w-full rounded-lg shadow-md"
                        />
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          console.log('點擊拒絕按鈕，案件 ID:', case_.id, '文檔 ID:', case_.docId)
                          handleCaseReject(case_.docId) // 使用 docId 而不是 id
                        }}
                        disabled={processing}
                      >
                        {processing ? '處理中...' : '不通過'}
                      </Button>
                      <Button 
                        onClick={() => {
                          console.log('點擊通過按鈕，案件 ID:', case_.id, '文檔 ID:', case_.docId)
                          handleCaseApprove(case_.docId) // 使用 docId 而不是 id
                        }}
                        disabled={processing}
                      >
                        {processing ? '處理中...' : '通過審核'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}