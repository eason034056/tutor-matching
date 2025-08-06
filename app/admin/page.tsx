'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChanged, User, signOut } from 'firebase/auth'
import LoginForm from '@/components/auth/LoginForm'
import { auth, db, storage } from '@/server/config/firebase'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Tutor, TutorCase, CaseNotificationData } from '@/server/types'
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc} from 'firebase/firestore'
import { ref } from 'firebase/storage'
import { deleteObject } from 'firebase/storage'
import Image from 'next/image'
import { sendNewCaseEmailNotification } from '@/webhook-config'

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [pendingTutors, setPendingTutors] = useState<(Tutor & { docId: string })[]>([])
  const [pendingCases, setPendingCases] = useState<(TutorCase & { docId: string })[]>([])
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [inactiveTime, setInactiveTime] = useState(0)

  // 搜尋相關的狀態
  const [tutorCode, setTutorCode] = useState('')
  const [caseNumber, setCaseNumber] = useState('')
  const [searchResults, setSearchResults] = useState<{
    tutor: (Tutor & { docId: string }) | null
    case: (TutorCase & { docId: string }) | null
  }>({ tutor: null, case: null })
  const [searching, setSearching] = useState(false)
  
  // 案件狀態更新相關
  const [selectedStatus, setSelectedStatus] = useState<'急徵' | '已徵到' | '有人接洽' | ''>('')
  const [updatingStatus, setUpdatingStatus] = useState(false)


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

  // 搜尋功能
  const handleSearch = async () => {
    if (!tutorCode && !caseNumber) {
      toast.info('請輸入教師編號或案件編號')
      return
    }

    setSearching(true)
    try {
      let tutorResult = null
      let caseResult = null

      // 搜尋教師
      if (tutorCode) {
        const tutorsQuery = query(
          collection(db, 'tutors'),
          where('tutorCode', '==', tutorCode)
        );
        const tutorsSnapshot = await getDocs(tutorsQuery);
        
        if (!tutorsSnapshot.empty) {
          const tutorDoc = tutorsSnapshot.docs[0];
          tutorResult = {
            ...tutorDoc.data(),
            docId: tutorDoc.id,
            id: tutorDoc.data().id || tutorDoc.id
          } as (Tutor & { docId: string });
        }
      }

      // 搜尋案件
      if (caseNumber) {
        const casesQuery = query(
          collection(db, 'cases'),
          where('caseNumber', '==', caseNumber)
        );
        const casesSnapshot = await getDocs(casesQuery);
        
        if (!casesSnapshot.empty) {
          const caseDoc = casesSnapshot.docs[0];
          caseResult = {
            ...caseDoc.data(),
            docId: caseDoc.id,
            id: caseDoc.data().id || caseDoc.id
          } as (TutorCase & { docId: string });
        }
      }

      setSearchResults({ 
        tutor: tutorResult, 
        case: caseResult 
      });

      if (!tutorResult && !caseResult) {
        toast.error('找不到符合的資料');
      } else {
        toast.success('搜尋完成！');
      }

    } catch (error) {
      console.error('搜尋失敗:', error);
      toast.error('搜尋失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setSearching(false);
    }
  };

  // 清除搜尋
  const clearSearch = () => {
    setTutorCode('');
    setCaseNumber('');
    setSearchResults({ tutor: null, case: null });
    setSelectedStatus('');
  };
  
  // 處理案件狀態更新
  const handleCaseStatusUpdate = async (caseDocId: string, newStatus: '急徵' | '已徵到' | '有人接洽') => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    
    try {
      console.log('開始更新案件狀態，案件 docId:', caseDocId, '新狀態:', newStatus);
      
      if (!caseDocId) {
        throw new Error('案件ID無效');
      }
      
      // 1. 從搜尋結果獲取案件的id來查找 approvedCases
      const searchedCase = searchResults.case;
      if (!searchedCase || !searchedCase.id) {
        throw new Error('無法找到案件識別碼');
      }
      
      // 2. 更新原始 cases 集合中的案件狀態
      const originalCaseRef = doc(db, 'cases', caseDocId);
      const originalCaseSnapshot = await getDoc(originalCaseRef);
      
      if (originalCaseSnapshot.exists()) {
        await updateDoc(originalCaseRef, {
          status: newStatus,
          statusUpdatedAt: new Date().toISOString()
        });
        console.log('已更新 cases 集合中的狀態');
      }
      
      // 3. 更新 approvedCases 集合中對應的案件狀態（用 caseNumber 查找）
      if (searchedCase.caseNumber) {
        const approvedCasesQuery = query(
          collection(db, 'approvedCases'),
          where('caseNumber', '==', searchedCase.caseNumber)
        );
        const approvedCasesSnapshot = await getDocs(approvedCasesQuery);
        
        if (!approvedCasesSnapshot.empty) {
          const approvedCaseDoc = approvedCasesSnapshot.docs[0];
          await updateDoc(approvedCaseDoc.ref, {
            status: newStatus,
            statusUpdatedAt: new Date().toISOString()
          });
          console.log('已更新 approvedCases 集合中的狀態，案件編號:', searchedCase.caseNumber);
        } else {
          console.warn('在 approvedCases 中找不到案件編號:', searchedCase.caseNumber);
        }
      } else {
        console.error('案件缺少 caseNumber，無法更新 approvedCases');
      }
      
      // 4. 更新搜尋結果中顯示的狀態
      if (searchResults.case) {
        setSearchResults({
          ...searchResults,
          case: {
            ...searchResults.case,
            status: newStatus
          }
        });
      }
      
      toast.success(`案件狀態已更新為「${newStatus}」`);
      setSelectedStatus(''); // 重置選擇
      
    } catch (error) {
      console.error('更新案件狀態失敗:', error);
      toast.error(`狀態更新失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 獲取狀態 Badge 的樣式
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case '急徵':
        return { 
          variant: 'destructive' as const,
          className: 'bg-red-500 hover:bg-red-600 text-white',
          icon: '🚨'
        };
      case '有人接洽':
        return { 
          variant: 'secondary' as const,
          className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          icon: '💬'
        };
      case '已徵到':
        return { 
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600 text-white',
          icon: '✅'
        };
      default:
        return { 
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-600',
          icon: '❓'
        };
    }
  };

  // 獲取所有已審核且願意接收通知的教師email列表
  const getApprovedTutorEmails = async () => {
    try {
      console.log('開始獲取已審核教師的email列表...')
      
      // 查詢所有已審核的教師
      const approvedTutorsQuery = query(
        collection(db, 'approvedTutors')
      );
      const approvedTutorsSnapshot = await getDocs(approvedTutorsQuery);
      
      // 提取email並過濾條件：
      // 1. 有效的email格式
      // 2. 願意接收新案件通知
      const emailList = approvedTutorsSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            email: data.email,
            receiveNotifications: data.receiveNewCaseNotifications
          };
        })
        .filter(({ email, receiveNotifications }) => {
          // 過濾掉空值、undefined、無效的email格式，以及不願意接收通知的教師
          return email && 
                 typeof email === 'string' && 
                 email.includes('@') && 
                 email.includes('.') &&
                 receiveNotifications === true; // 只有同意接收通知的教師
        })
        .map(({ email }) => email); // 只回傳email字串

      console.log(`找到 ${emailList.length} 個願意接收通知的有效教師email:`, emailList);
      return emailList;
    } catch (error) {
      console.error('獲取教師email列表失敗:', error);
      return [];
    }
  };

  // 發送新案件郵件通知
  const sendNewCaseNotification = async (caseData: CaseNotificationData) => {
    try {
      console.log('準備發送新案件郵件通知...');
      
      // 獲取教師email列表
      const emailList = await getApprovedTutorEmails();
      
      // 使用webhook配置文件中的專用函數發送通知
      const result = await sendNewCaseEmailNotification(caseData, emailList);
      
      if (result.success) {
        toast.success(`郵件通知已發送給 ${emailList.length} 位教師`);
      } else {
        // 如果是因為沒有email或webhook未啟用，不顯示錯誤
        if (result.message === '沒有有效的教師email') {
          console.log('沒有找到有效的教師email，跳過郵件通知');
        } else if (result.message === 'Webhook功能未啟用') {
          console.log('Webhook功能未啟用，跳過郵件通知');
        } else {
          toast.error('郵件通知發送失敗，但案件已成功審核');
        }
      }
    } catch (error) {
      console.error('發送郵件通知失敗:', error);
      // 不要因為郵件發送失敗而影響案件審核流程
      toast.error('郵件通知發送失敗，但案件已成功審核');
    }
  };

  // 監聽使用者登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 檢查是否為管理員
          const adminRef = collection(db, 'admins');
          const q = query(adminRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            // 如果不是管理員，強制登出
            await signOut(auth);
            toast.error('您沒有管理員權限');
            setUser(null);
          } else {
            setUser(user);
            fetchPendingData();
          }
        } catch (error) {
          console.error('檢查管理員權限時發生錯誤:', error);
          toast.error('檢查權限時發生錯誤');
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        email: tutorData.email,
        school: tutorData.school,
        approvedAt: new Date().toISOString(),
        receiveNewCaseNotifications: tutorData.receiveNewCaseNotifications || false // 確保包含通知設定
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
      
      // 發送新案件郵件通知給所有已審核的教師
      const notificationData: CaseNotificationData = {
        caseNumber: caseData.caseNumber,
        subject: caseData.subject,
        hourlyFee: caseData.hourlyFee,
        location: caseData.location,
        availableTime: caseData.availableTime,
        teacherRequirements: caseData.teacherRequirements || '',
        studentDescription: caseData.studentDescription || ''
      };
      await sendNewCaseNotification(notificationData);
      
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
          <TabsTrigger value="search">
            🔍 搜尋系統
            {searchResults.tutor !== null || searchResults.case !== null && (
              <Badge variant="secondary" className="ml-2">
                找到資料
              </Badge>
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
                  <p>電子郵件：{tutor.email}</p>
                  <p>科目：{tutor.subjects.join(', ')}</p>
                  <p>經驗：{tutor.experience}</p>
                  <p>學校：{tutor.school}</p>
                  <p>專長：{tutor.expertise}</p>
                  <p>學位：{tutor.major}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span>接收新案件通知：</span>
                    <Badge variant={tutor.receiveNewCaseNotifications ? "default" : "secondary"}>
                      {tutor.receiveNewCaseNotifications ? "✅ 是" : "❌ 否"}
                    </Badge>
                  </div>
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
                        <div className="relative">
                          <Image
                            src={case_.idCardUrl} 
                            alt="身分證" 
                            width={500}
                            height={300}
                            className="w-full rounded-lg shadow-md"
                            loading="lazy"
                            onError={(e) => {
                              console.error('圖片載入失敗:', case_.idCardUrl);
                              // 設置一個預設圖片或錯誤提示
                              e.currentTarget.src = '/placeholder.png';
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 break-all">
                          圖片 URL: {case_.idCardUrl}
                        </p>
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

        <TabsContent value="search">
          <div className="space-y-6">
            {/* 搜尋表單 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔍 智能搜尋系統
                  <Badge variant="outline">已審核通過資料</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* 教師編號搜尋 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">教師編號</label>
                    <Input
                      placeholder="輸入教師編號 (如: T001)"
                      value={tutorCode}
                      onChange={(e) => setTutorCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full"
                    />
                  </div>

                  {/* 案件編號搜尋 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">案件編號</label>
                    <Input
                      placeholder="輸入案件編號 (如: CWBKOXV)"
                      value={caseNumber}
                      onChange={(e) => setCaseNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 搜尋按鈕 */}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSearch} 
                    disabled={searching}
                    className="flex items-center gap-2"
                  >
                    {searching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        搜尋中...
                      </>
                    ) : (
                      <>
                        🔍 開始搜尋
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearSearch}
                    disabled={searching}
                  >
                    🗑️ 清除條件
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 搜尋結果 */}
            {searchResults.tutor !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    👨‍🏫 教師搜尋結果
                    <Badge>{searchResults.tutor ? '找到' : '無'}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {searchResults.tutor ? (
                    <div className="grid gap-4">
                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg text-blue-600">{searchResults.tutor.name}</h3>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✅ 已審核
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">聯絡資訊</p>
                            <p>📞 {searchResults.tutor.phoneNumber}</p>
                            <p>📧 {searchResults.tutor.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">學歷背景</p>
                            <p>🏫 {searchResults.tutor.school}</p>
                            <p>🎓 {searchResults.tutor.major}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">教學經驗</p>
                            <p>{searchResults.tutor.experience}</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">教學專長</p>
                          <p className="text-sm">{searchResults.tutor.expertise}</p>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">授課科目</p>
                          <div className="flex flex-wrap gap-1">
                           {searchResults.tutor.subjects?.map((subject, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">新案件通知設定</p>
                          <Badge variant={searchResults.tutor.receiveNewCaseNotifications ? "default" : "secondary"}>
                            {searchResults.tutor.receiveNewCaseNotifications ? "✅ 接收通知" : "❌ 不接收通知"}
                          </Badge>
                        </div>

                          {/* 證件照片 */}
                          <div className="mt-6">
                            <p className="text-sm font-medium text-gray-600 mb-4">證件照片</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* 身分證照片 */}
                              {searchResults.tutor.idCardUrl && (
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">身分證</p>
                                  <div className="relative aspect-[3/2] overflow-hidden rounded-lg border">
                                    <Image
                                      src={searchResults.tutor.idCardUrl}
                                      alt="身分證"
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {/* 學生證照片 */}
                              {searchResults.tutor.studentIdCardUrl && (
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">學生證</p>
                                  <div className="relative aspect-[3/2] overflow-hidden rounded-lg border">
                                    <Image
                                      src={searchResults.tutor.studentIdCardUrl}
                                      alt="學生證"
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                   ) : (
                     <p className="text-center text-gray-500 py-8">找不到符合的教師資料</p>
                   )}
                  </CardContent>
                </Card>
              )}

            {searchResults.case !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📚 案件搜尋結果
                    <Badge>{searchResults.case ? '找到' : '無'}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {searchResults.case ? (
                    <div className="grid gap-4">
                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg text-purple-600">
                            案件編號：{searchResults.case.caseNumber}
                          </h3>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✅ 已審核
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">家長資訊</p>
                            <p>👤 {searchResults.case.parentName}</p>
                            <p>📞 {searchResults.case.parentPhone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">課程資訊</p>
                            <p>📖 {searchResults.case.subject}</p>
                            <p>💰 時薪 ${searchResults.case.hourlyFee}</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600">上課地點</p>
                          <p>📍 {searchResults.case.location}</p>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600">可上課時間</p>
                          <p>⏰ {searchResults.case.availableTime}</p>
                        </div>

                        {/* 案件狀態顯示和修改 */}
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">案件狀態</p>
                            {searchResults.case.status && (() => {
                              const statusStyle = getStatusBadgeStyle(searchResults.case.status);
                              return (
                                <Badge 
                                  variant={statusStyle.variant}
                                  className={statusStyle.className}
                                >
                                  {statusStyle.icon} {searchResults.case.status}
                                </Badge>
                              );
                            })()}
                          </div>
                          
                          {/* 狀態更新控制項 */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                            <div className="md:col-span-2">
                              <label className="block text-xs text-gray-600 mb-1">更新狀態</label>
                              <Select 
                                value={selectedStatus} 
                                onValueChange={(value) => setSelectedStatus(value as '急徵' | '已徵到' | '有人接洽' | '')}
                                disabled={updatingStatus}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="選擇新狀態..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="急徵">
                                    <div className="flex items-center gap-2">
                                      <span className="text-red-500">🚨</span>
                                      急徵
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="有人接洽">
                                    <div className="flex items-center gap-2">
                                      <span className="text-yellow-500">💬</span>
                                      有人接洽
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="已徵到">
                                    <div className="flex items-center gap-2">
                                      <span className="text-green-500">✅</span>
                                      已徵到
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => {
                                if (selectedStatus && searchResults.case) {
                                  handleCaseStatusUpdate(
                                    searchResults.case.docId, 
                                    selectedStatus as '急徵' | '已徵到' | '有人接洽'
                                  );
                                }
                              }}
                              disabled={!selectedStatus || updatingStatus}
                              className="h-8"
                            >
                              {updatingStatus ? (
                                <div className="flex items-center gap-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  更新中...
                                </div>
                              ) : (
                                '🔄 更新'
                              )}
                            </Button>
                          </div>
                        </div>

                        {searchResults.case.teacherRequirements && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">教師要求</p>
                            <p className="text-sm bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                              {searchResults.case.teacherRequirements}
                            </p>
                          </div>
                        )}

                                                  {searchResults.case.studentDescription && (
                           <div>
                             <p className="text-sm text-gray-600">學生狀況</p>
                             <p className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                               {searchResults.case.studentDescription}
                             </p>
                           </div>
                          )}

                          {/* 案件相關照片 */}
                          {searchResults.case.idCardUrl && (
                            <div className="mt-6">
                              <p className="text-sm font-medium text-gray-600 mb-4">身分證照片</p>
                              <div className="max-w-lg">
                                <div className="relative aspect-[3/2] overflow-hidden rounded-lg border">
                                  <Image
                                    src={searchResults.case.idCardUrl}
                                    alt="身分證"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                   ) : (
                     <p className="text-center text-gray-500 py-8">找不到符合的案件資料</p>
                   )}
                  </CardContent>
                </Card>
              )}

            {/* 無搜尋結果 */}
            {!searching && 
             searchResults.tutor === null && 
             searchResults.case === null && 
             (tutorCode || caseNumber) && (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2">找不到符合條件的資料</h3>
                  <p className="text-gray-600 mb-4">
                    請嘗試調整搜尋條件或關鍵字
                  </p>
                  <Button variant="outline" onClick={clearSearch}>
                    重新搜尋
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}