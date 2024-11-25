'use server'

import { tutors } from '@/app/data/tutors'

export async function verifyTutor(tutorCode: string) {
  // 模擬資料庫查詢延遲
  await new Promise(resolve => setTimeout(resolve, 500))

  // 驗證家教編號格式
  if (!tutorCode.match(/^T\d{5}$/)) {
    throw new Error('無效的家教編號格式')
  }

  // 查找家教
  const tutor = tutors.find(t => t.tutorCode === tutorCode)
  
  if (!tutor) {
    throw new Error('找不到此家教編號')
  }

  if (!tutor.isActive) {
    throw new Error('此家教帳號已停用')
  }

  return {
    success: true,
    tutor: {
      name: tutor.name,
      subjects: [tutor.subject]
    }
  }
} 