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
  const [pendingTutors, setPendingTutors] = useState<Tutor[]>([])
  const [pendingCases, setPendingCases] = useState<TutorCase[]>([])
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

      // 使用 Firestore 查詢
      const tutorsQuery = query(collection(db, 'tutors'), where('status', '==', 'pending'));
      const casesQuery = query(collection(db, 'cases'), where('pending', '==', 'pending'));
      
      const [tutorsSnapshot, casesSnapshot] = await Promise.all([
        getDocs(tutorsQuery),
        getDocs(casesQuery)
      ]);

      const tutors = tutorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tutor[];

      const cases = casesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TutorCase[];

      setPendingTutors(tutors);
      setPendingCases(cases);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('載入失敗');
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
  const handleTutorApprove = async (id: string) => {
    try {
      const q = query(collection(db, 'tutors'), where('id', '==', id));
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        throw new Error('找不到該教師')
      }
      const tutorRef = querySnapshot.docs[0].ref
      const tutorData = querySnapshot.docs[0].data();

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
        tutorId: id,
        experience: tutorData.experience,
        subjects: tutorData.subjects,
        expertise: tutorData.expertise,
        major: tutorData.major,
        name: tutorData.name,
        school: tutorData.school,
        approvedAt: new Date().toISOString()
      });
      
      toast.success('審核通過')
      fetchPendingData()
    } catch (error) {
      console.error('Error approving tutor:', error);
      toast.error(error instanceof Error ? error.message : '審核失敗')
    }
  }

  // 處理家教拒絕
  const handleTutorReject = async (id: string) => {
    try {
      const q = query(collection(db, 'tutors'), where('id', '==', id));
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        throw new Error('找不到該教師')
      }
      const tutorRef = querySnapshot.docs[0].ref

      // Delete ID card images from storage
      const tutorData = querySnapshot.docs[0].data();
      
      // Delete ID card photo if exists
      if (tutorData.idCardUrl) {
        try {
          const idCardRef = ref(storage, tutorData.idCardUrl);
          await deleteObject(idCardRef);
        } catch (error) {
          console.error('Error deleting ID card:', error);
        }
      }

      // Delete student ID photo if exists  
      if (tutorData.studentIdCardUrl) {
        try {
          const studentIdRef = ref(storage, tutorData.studentIdCardUrl);
          await deleteObject(studentIdRef);
        } catch (error) {
          console.error('Error deleting student ID:', error);
        }
      }
      await deleteDoc(tutorRef)
      
      toast.success('已拒絕申請')
      fetchPendingData()
    } catch (error) {
      console.error('操作失敗: ', error)
    }
  }

  // 處理案件審核
  const handleCaseApprove = async (id: string) => {
    try {
      if (!id) {
        console.error('No case ID provided')
        toast.error('案件ID無效')
        return
      }
      console.log(id)

      const caseRef = doc(db, 'cases', id);
      const caseSnapshot = await getDoc(caseRef);
      const caseData = caseSnapshot.data();

      if (!caseData) {
        throw new Error('找不到該案件')
      }

      await updateDoc(caseRef, {
        pending: 'approved'
      });

      // Add approved case to approvedCases collection
      await addDoc(collection(db, 'approvedCases'), {
        caseNumber: caseData.caseNumber,
        subject: caseData.subject,
        grade: caseData.grade,
        location: caseData.location,
        availableTime: caseData.availableTime,
        teacherRequirements: caseData.teacherRequirements,
        studentDescription: caseData.studentDescription,
        hourlyFee: caseData.hourlyFee,
        status: caseData.status,
        approvedAt: new Date().toISOString()
      });
      

      toast.success('案件已通過審核')
      fetchPendingData()
    } catch (error) {
      console.error('Error approving case:', error)
      toast.error('審核失敗')
    }
  }

  // 處理案件拒絕
  const handleCaseReject = async (id: string) => {
    try {
      const caseRef = doc(db, 'cases', id);

      // 刪除 storage 中的照片
      if (caseRef) {
        const caseSnapshot = await getDoc(caseRef);
        const caseData = caseSnapshot.data();
        if (caseData?.idCardUrl) {
          const imageRef = ref(storage, caseData.idCardUrl);
          await deleteObject(imageRef);
        }
      }

      await deleteDoc(caseRef);
      
      toast.success('已拒絕案件')
      fetchPendingData()
    } catch (error) {
      console.error('操作失敗: ', error)
      toast.error('操作失敗')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">管理員後台</h1>
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
                      onClick={() => handleTutorReject(tutor.id.toString())}
                    >
                      不通過
                    </Button>
                    <Button 
                      onClick={() => handleTutorApprove(tutor.id.toString())}
                    >
                      通過審核
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
              <CardTitle>待審核案件列表</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingCases.map((case_) => (
                <div key={case_.id} className="border p-4 rounded mb-4">
                  <h3 className="font-bold">案件編號：{case_.caseNumber}</h3>
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
                      onClick={() => handleCaseReject(case_.id)}
                    >
                      不通過
                    </Button>
                    <Button 
                      onClick={() => handleCaseApprove(case_.id)}
                    >
                      通過審核
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}