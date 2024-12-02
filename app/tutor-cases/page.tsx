'use client'

import { useState } from 'react'
import { TutorCase, tutorCases } from '@/app/data/cases'
import { verifyTutor } from '@/app/actions/verify-tutor'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'

export default function TutorCasesPage() {
  const [selectedCase, setSelectedCase] = useState<number | null>(null)
  const [tutorCode, setTutorCode] = useState('') // 暫存輸入的家教編號，之後接資料庫會替換掉
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [currentCase, setCurrentCase] = useState<TutorCase | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // 每頁顯示的案件數量
  
  const canApply = (tutorCase: TutorCase) => {
    if (tutorCase.status === '已徵到' || tutorCase.status === '有人接洽') return false;
    return tutorCase.status === '急徵';
  };

  // 在 return 語句之前加入排序邏輯
  const sortedTutorCases = [...tutorCases].sort((a, b) => {
    // 定義狀態優先順序
    const statusOrder = {
      '急徵': 0,
      '有人接洽': 1, 
      '已徵到': 2
    };
    
    // 根據狀態優先順序進行排序
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // 計算總頁數
  const totalPages = Math.ceil(sortedTutorCases.length / itemsPerPage)
  
  // 取得當前頁面要顯示的案件
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedTutorCases.slice(startIndex, endIndex)
  }

  // 分頁按鈕處理函數
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">家教案件列表</h1>
      <Card>
        <CardHeader>
          <CardTitle>所有家教需求</CardTitle>
        </CardHeader>
        <CardContent>
          {tutorCases.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-20">案件編號</TableHead>
                    <TableHead className="min-w-20">科目</TableHead>
                    <TableHead className="min-w-20">年級</TableHead>
                    <TableHead className="min-w-20">上課地點</TableHead>
                    <TableHead className="min-w-24">可上課時段</TableHead>
                    <TableHead className="min-w-20">教師條件</TableHead>
                    <TableHead className="min-w-24">學生狀況</TableHead>
                    <TableHead className="min-w-20">時薪</TableHead>
                    <TableHead className="min-w-20">狀態</TableHead>
                    <TableHead className="min-w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentPageItems().map((tutorCase) => (
                    <TableRow key={tutorCase.id}>
                      <TableCell className="font-medium">{tutorCase.caseNumber}</TableCell>
                      <TableCell>{tutorCase.subject}</TableCell>
                      <TableCell className="w-20">{tutorCase.grade}</TableCell>
                      <TableCell className="w-20">{tutorCase.location}</TableCell>
                      <TableCell>{tutorCase.availableTime}</TableCell>
                      <TableCell>{tutorCase.teacherRequirements}</TableCell>
                      <TableCell>{tutorCase.studentDescription}</TableCell>
                      <TableCell>${tutorCase.hourlyFee}</TableCell>
                      <TableCell className="w-24">
                        <div className="flex justify-center">
                          <Badge 
                            variant={tutorCase.status === '急徵' ? 'destructive' : 'secondary'}
                            className="w-16 text-center whitespace-nowrap flex items-center justify-center"
                          >
                            {tutorCase.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog open={selectedCase === tutorCase.id} onOpenChange={(open: boolean) => {
                          if (!open) {
                            setSelectedCase(null)
                            // 重置輸入的家教編號
                            setTutorCode('')
                            setError('')
                            setVerificationSuccess(false)
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline"
                              onClick={() => setSelectedCase(tutorCase.id)}
                              disabled={!canApply(tutorCase)}
                            >應徵</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                            <DialogHeader className="flex flex-row items-center justify-between bg-white">
                              <DialogTitle>應徵案件</DialogTitle>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto py-4">
                              <div className="space-y-4 pb-16">
                                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                  <p className="text-blue-800 font-medium mb-2">接案須知：</p>
                                  <p className="text-blue-700">
                                    請寄信至家教中心信箱，並附上您的家教編號，家教中心會盡快與您聯絡。<br />
                                    若還沒進行教師編號，請先至<Link href="/tutor-registration" className="text-blue-600 underline">教師登錄</Link>頁面進行登錄。填完資料後大約１～２天會收到教師編號。
                                  </p>
                                </div>

                                <div className="space-y-3 p-4">
                                  <div>
                                    <h3 className="font-medium mb-1">案件編號</h3>
                                    <p>{tutorCase.caseNumber}</p>
                                  </div>

                                  <div>
                                    <h3 className="font-medium mb-1">家教中心 Email</h3>
                                    <p className="text-blue-600">tutoring.center@example.com</p>
                                  </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg">
                                  <p className="text-yellow-800">
                                    提醒：請務必在收到家長聯絡資訊後三天內用email回報試教時間，以確保案件不會被重新開放。
                                  </p>
                                </div>
                              </div>
                            </div>

                            {verificationSuccess && (
                              <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
                                <div className="flex justify-end">
                                  <Button onClick={() => {
                                    setSelectedCase(null)
                                    setVerificationSuccess(false)
                                  }}>
                                    確認
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 分頁控制區 */}
              <div className="flex justify-center items-center gap-2 mt-4">
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
            </>
          ) : (
            <p>目前沒有家教案件</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

