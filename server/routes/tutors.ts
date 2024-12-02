import express from 'express'
import { tutorsCollection, db } from '../config/firebase'
import { getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { Tutor } from '../types'

const router = express.Router()

// 獲取所有家教老師
router.get('/', async (req, res) => {
  try {
    const tutorsSnapshot = await getDocs(tutorsCollection)
    const tutors = tutorsSnapshot.docs.map(doc => ({
      ...(doc.data() as Tutor)
    })) as Tutor[]
    
    res.json(tutors)
  } catch (error) {
    res.status(500).json({ error: '獲取家教老師資料失敗' })
  }
})

// 獲取單個家教老師
router.get('/:id', async (req, res) => {
  try {
    const tutorDocRef = doc(db, 'tutors', req.params.id)
    const tutorDoc = await getDoc(tutorDocRef)
    
    if (!tutorDoc.exists()) {
      return res.status(404).json({ error: '找不到該家教老師' })
    }
    
    res.json({
      id: tutorDoc.id,
      ...tutorDoc.data()
    })
  } catch (error) {
    res.status(500).json({ error: '獲取家教老師資料失敗' })
  }
})

// 新增家教老師
router.post('/', async (req, res) => {
  try {
    const newTutor = {
      ...req.body,
      createdAt: new Date()
    }
    
    const docRef = await addDoc(tutorsCollection, newTutor)
    res.status(201).json({
      id: docRef.id,
      ...newTutor
    })
    console.log("新增家教成功");
  } catch (error) {
    res.status(500).json({ error: '新增家教老師失敗' })
  }
})

// 更新家教老師資料
router.put('/:id', async (req, res) => {
  try {
    const tutorDocRef = doc(db, 'tutors', req.params.id)
    await updateDoc(tutorDocRef, req.body)
    res.json({ message: '更新成功' })
  } catch (error) {
    res.status(500).json({ error: '更新家教老師資料失敗' })
  }
})

// 刪除家教老師
router.delete('/:id', async (req, res) => {
  try {
    const tutorDocRef = doc(db, 'tutors', req.params.id)
    await deleteDoc(tutorDocRef)
    res.json({ message: '刪除成功' })
  } catch (error) {
    res.status(500).json({ error: '刪除家教老師失敗' })
  }
})

export default router 