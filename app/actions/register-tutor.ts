'use server'

import { revalidatePath } from 'next/cache'

interface TutorData {
  name: string
  phoneNumber: string
  subjects: string[]
  experience: string
  school: string
  major: string
  expertise: string
  tutorCode?: string
}

export async function registerTutor(formData: TutorData) {
  const tutorCode = 'T' + Math.floor(10000 + Math.random() * 90000)

  const tutorData = {
    ...formData,
    tutorCode
  }

  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('Received tutor registration:', tutorData)

  revalidatePath('/tutors')
  return { success: true, tutorCode }
}

