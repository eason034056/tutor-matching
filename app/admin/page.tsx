'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Tutor, TutorCase } from '@/server/types'

export default function AdminPage() {
  const [pendingTutors, setPendingTutors] = useState<Tutor[]>([])
  const [pendingCases, setPendingCases] = useState<TutorCase[]>([])
  
  // 載入待審核資料
  useEffect(() => {
    fetchPendingData()
  }, [])

  const fetchPendingData = async () => {
    try {
      const [tutorsRes, casesRes] = await Promise.all([
        fetch('/api/admin/tutors/pending'),
        fetch('/api/admin/cases/pending')
      ])

      if (!tutorsRes.ok || !casesRes.ok) throw new Error('Failed to fetch')
      
      const tutors = await tutorsRes.json()
      const cases = await casesRes.json()
      
      setPendingTutors(tutors)
      setPendingCases(cases)
    } catch (error) {
      toast.error('載入失敗')
    }
  }

  // 處理教審核
  const handleTutorApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/tutors/${id}/approve`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('審核失敗')
      
      toast.success('審核通過')
      fetchPendingData()
    } catch (error) {
      toast.error('審核失敗')
    }
  }

  // 處理家教拒絕
  const handleTutorReject = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/tutors/${id}/reject`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('拒絕失敗')
      
      toast.success('已拒絕申請')
      fetchPendingData()
    } catch (error) {
      toast.error('操作失敗')
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

      console.log('Sending approval request for case:', id)
      const response = await fetch(`/api/admin/cases/${id}/approve`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('審核失敗')
      
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
      const response = await fetch(`/api/admin/cases/${id}/reject`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('拒絕失敗')
      
      toast.success('已拒絕案件')
      fetchPendingData()
    } catch (error) {
      toast.error('操作失敗')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">管理員後台</h1>
      
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
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-semibold mb-2">學生證</h4>
                      <img 
                        src={tutor.studentIdCardUrl} 
                        alt="學生證" 
                        className="w-full rounded-lg shadow-md"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">身分證</h4>
                      <img 
                        src={tutor.idCardUrl} 
                        alt="身分證" 
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
                      <img 
                        src={case_.idCardUrl} 
                        alt="身分證" 
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