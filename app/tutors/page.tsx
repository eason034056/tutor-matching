'use client'

import { tutors } from '../data/tutors'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from 'react'

export default function TutorsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9 // 每頁顯示 9 位老師 (3x3 網格)
  
  // 計算總頁數
  const totalPages = Math.ceil(tutors.length / itemsPerPage)
  
  // 取得當前頁面要顯示的老師資料
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return tutors.slice(startIndex, endIndex)
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
          <Card key={tutor.id} className="hover:shadow-lg transition-shadow">
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
