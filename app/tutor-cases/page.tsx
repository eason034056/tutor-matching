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

export default function TutorCasesPage() {
  const [selectedCase, setSelectedCase] = useState<number | null>(null)
  const [tutorCode, setTutorCode] = useState('') // 暫存輸入的家教編號，之後接資料庫會替換掉
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [currentCase, setCurrentCase] = useState<TutorCase | null>(null)

  const handleApply = async (caseId: number) => {
    if (!tutorCode) {
      setError('請輸入家教編號')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await verifyTutor(tutorCode)
      
      const caseInfo = tutorCases.find(c => c.id === caseId)
      console.log(caseInfo)
      if (caseInfo) {
        caseInfo.status = '有人接洽'
        caseInfo.applicant = {
          tutorCode: tutorCode,
          appliedAt: new Date().toISOString(),
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
        setCurrentCase(caseInfo)
        console.log(currentCase)
        setVerificationSuccess(true)
      }
      
      setError('')
      
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('應徵失敗，請稍後再試')
      }
      setVerificationSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canApply = (tutorCase: TutorCase) => {
    if (tutorCase.status === '已徵到') return false;
    if (tutorCase.status === '有人接洽') {
      return tutorCase.applicant?.tutorCode === tutorCode;
    }
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">家教案件列表</h1>
      <Card>
        <CardHeader>
          <CardTitle>所有家教需求</CardTitle>
        </CardHeader>
        <CardContent>
          {tutorCases.length > 0 ? (
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
                {sortedTutorCases.map((tutorCase) => (
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
                          >
                            {tutorCase.status === '有人接洽' && tutorCase.applicant?.tutorCode ? '查看資訊' : '應徵'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                          <DialogHeader className="flex flex-row items-center justify-between bg-white">
                            <DialogTitle>
                              {(verificationSuccess || tutorCase.status === '有人接洽') ? '案件資訊' : '應徵案件'}
                            </DialogTitle>
                          </DialogHeader>

                          <div className="flex-1 overflow-y-auto py-4">
                            {!verificationSuccess ? (
                              // 驗證表單
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="tutorCode">請輸入家教編號</Label>
                                  <Input
                                    id="tutorCode"
                                    value={tutorCode}
                                    onChange={(e) => setTutorCode(e.target.value)}
                                    placeholder="請輸入您的家教編號 (例：T12345)"
                                    className="mt-1"
                                    disabled={isSubmitting}
                                  />
                                </div>
                                {error && (
                                  <p className="text-sm text-red-500">{error}</p>
                                )}
                                <Button 
                                  onClick={() => handleApply(tutorCase.id)}
                                  className="w-full"
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? '驗證中...' : '確認應徵'}
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4 pb-16">
                                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                  <p className="text-blue-800 font-medium mb-2">重要提醒：</p>
                                  <p className="text-blue-700">
                                    請在三天內使用email回報試教時間，若超過三天則會重新開放案件讓其他家教老師應徵
                                  </p>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <h3 className="font-medium mb-1">案件編號</h3>
                                    <p>{currentCase?.caseNumber}</p>
                                  </div>
                                  
                                  <div>
                                    <h3 className="font-medium mb-1">家長姓名</h3>
                                    <p>{currentCase?.parentName}</p>
                                  </div>

                                  <div>
                                    <h3 className="font-medium mb-1">聯絡電話</h3>
                                    <p>{currentCase?.parentPhone}</p>
                                  </div>

                                  <div>
                                    <h3 className="font-medium mb-1">LINE ID</h3>
                                    <p>{currentCase?.lineId}</p>
                                  </div>

                                  <div>
                                    <h3 className="font-medium mb-1">家教中心 Email</h3>
                                    <p className="text-blue-600">tutoring.center@example.com</p>
                                  </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg">
                                  <p className="text-yellow-800">
                                    提醒：請務必在三天內回報試教時間，以確保案件不會被重新開放。
                                  </p>
                                </div>
                              </div>
                            )}
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
          ) : (
            <p>目前沒有家教案件</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

