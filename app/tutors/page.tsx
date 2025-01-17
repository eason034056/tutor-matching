'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/server/config/firebase"
import { ApprovedTutor } from '@/server/types/index'

export default function TutorsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [approvedTutors, setApprovedTutors] = useState<ApprovedTutor[]>([])
  const itemsPerPage = 6 // 每頁顯示 6 位老師 (2x3 網格)

  // 獲取 approved 狀態的老師資料
  useEffect(() => {
    const fetchApprovedTutors = async () => {
      // 先檢查 sessionStorage 中是否有資料
      const cachedData = sessionStorage.getItem('approvedTutors')
      const cachedTimestamp = sessionStorage.getItem('approvedTutorsTimestamp')
      
      // 如果有快取資料且未超過 10 分鐘，直接使用快取資料
      if (cachedData && cachedTimestamp) {
        const now = new Date().getTime()
        const cacheTime = parseInt(cachedTimestamp)
        const tenMinutes = 10 * 60 * 1000
        
        if (now - cacheTime < tenMinutes) {
          setApprovedTutors(JSON.parse(cachedData))
          return
        }
      }

      // 如果沒有快取或快取已過期，從資料庫獲取資料
      const q = query(collection(db, 'approvedTutors'))
      const querySnapshot = await getDocs(q)
      const tutorsList: ApprovedTutor[] = querySnapshot.docs.map(doc => ({
        ...(doc.data() as ApprovedTutor)
      }))
      console.log(tutorsList)
      
      // 更新 state
      setApprovedTutors(tutorsList)
      
      // 更新 sessionStorage
      sessionStorage.setItem('approvedTutors', JSON.stringify(tutorsList))
      sessionStorage.setItem('approvedTutorsTimestamp', new Date().getTime().toString())
    }

    fetchApprovedTutors()
  }, [])
  
  // 計算總頁數
  const totalPages = Math.ceil(approvedTutors.length / itemsPerPage)
  
  // 取得當前頁面要顯示的老師資料
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return approvedTutors.slice(startIndex, endIndex)
  }

  // 分頁按鈕處理函數
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">尋找合適的家教老師</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getCurrentPageItems().map((tutor) => (
          <Card key={tutor.tutorId} className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-2xl">{tutor.name.charAt(0)}老師</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">教學科目:</span>
                <span>{tutor.subjects.join(', ')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">教學經驗:</span>
                <span>{tutor.experience}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">學校:</span>
                <span>{tutor.school}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">科系:</span>
                <span>{tutor.major}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[80px]">專長:</span>
                <span>{tutor.expertise}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 分頁控制區 */}
      <div className="flex justify-center items-center gap-2 mt-8">
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一頁
        </Button>
        
        {/* 頁碼按鈕 */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            onClick={() => handlePageChange(pageNum)}
            className="w-10 h-10"
          >
            {pageNum}
          </Button>
        ))}
        
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          下一頁
        </Button>
      </div>
    </div>
  )
}
