'use client'

import { useState } from 'react'
import { tutorCases } from '@/app/data/cases'
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
  const [tutorCode, setTutorCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleApply = async (caseId: number) => {
    if (!tutorCode) {
      setError('請輸入家教編號')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // 驗證家教編號
      const result = await verifyTutor(tutorCode)

      // 這裡應該要記錄應徵資訊到資料庫
      console.log(`家教 ${result.tutor.name} (${tutorCode}) 應徵案件 ${caseId}`)
      
      // 清除表單
      setTutorCode('')
      setSelectedCase(null)
      setError('')
      
      // 顯示成功訊息
      alert('應徵成功！我們會盡快通知案主。')
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('應徵失敗，請稍後再試')
      }
    } finally {
      setIsSubmitting(false)
    }
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>科目</TableHead>
                  <TableHead className="w-20">年級</TableHead>
                  <TableHead className="w-20">上課地點</TableHead>
                  <TableHead>可上課時段</TableHead>
                  <TableHead>教師條件</TableHead>
                  <TableHead>學生狀況</TableHead>
                  <TableHead>時薪</TableHead>
                  <TableHead className="w-24">狀態</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutorCases.map((tutorCase) => (
                  <TableRow key={tutorCase.id}>
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
                          setTutorCode('')
                          setError('')
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline"
                            onClick={() => setSelectedCase(tutorCase.id)}
                            disabled={tutorCase.status !== '急徵'}
                          >
                            應徵
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>應徵案件</DialogTitle>
                          </DialogHeader>
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

