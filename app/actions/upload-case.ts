'use server'

import { revalidatePath } from 'next/cache'

interface CaseUploadData {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  idNumber: string;
  studentGender: string;
  lineId: string;
  department: string;
  grade: string;
  studentDescription: string;
  subject: string;
  location: string;
  availableTime: string;
  teacherRequirements: string;
  hourlyFee: string;
  message: string;
}

export async function uploadCase(formData: CaseUploadData) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('Received case upload:', formData)
  revalidatePath('/tutor-cases')
  return { success: true }
}

