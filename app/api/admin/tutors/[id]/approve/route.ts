import { NextResponse } from 'next/server'
import { updateDoc, where, query, getDocs, addDoc } from 'firebase/firestore'
import { tutorsCollection, approvedTutorsCollection } from '@/server/config/firebase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('Received tutor approval request for ID:', resolvedParams.id)
    const q = query(tutorsCollection, where('id', '==', resolvedParams.id))
    console.log('Query:', q)
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return NextResponse.json({ error: '找不到該教師' }, { status: 404 })
    }
    
    const tutorDoc = querySnapshot.docs[0]
    const tutorData = tutorDoc.data()
    const tutorRef = tutorDoc.ref

    // Validate required fields
    const requiredFields = ['experience', 'expertise', 'major', 'name', 'school', 'subjects']
    const missingFields = requiredFields.filter(field => !tutorData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `教師資料不完整，缺少: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    await updateDoc(tutorRef, {
      status: 'approved',
      isActive: true,
      approvedAt: new Date().toISOString()
    })

    try {
      // Store approved tutor info in approvedTutorsCollection
      await addDoc(approvedTutorsCollection, {
        tutorId: resolvedParams.id,
        experience: tutorData.experience,
        expertise: tutorData.expertise,
        major: tutorData.major,
        name: tutorData.name,
        school: tutorData.school,
        subjects: tutorData.subjects,
        approvedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error storing approved tutor data:', error)
      // Revert the approval if storing data fails
      await updateDoc(tutorRef, {
        status: 'pending',
        isActive: false,
        approvedAt: null
      })
      throw new Error('Failed to store approved tutor data')
    }
    
    return NextResponse.json({ message: '審核通過' })
  } catch (error) {
    console.error('Error approving tutor:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '審核失敗' },
      { status: 500 }
    )
  }
}