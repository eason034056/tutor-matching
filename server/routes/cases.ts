import express from 'express'
import { 
  casesCollection, 
  db 
} from '../config/firebase'
import { 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc 
} from 'firebase/firestore'
import { TutorCase } from '../types'

const router = express.Router()

// 獲取所有案件
router.get('/', async (req, res) => {
  try {
    const casesSnapshot = await getDocs(casesCollection)
    const cases = casesSnapshot.docs.map(doc => ({
      ...(doc.data() as TutorCase)
    })) as TutorCase[]
    
    res.json(cases)
  } catch (error) {
    res.status(500).json({ error: '獲取案件資料失敗' })
  }
})

// 獲取單個案件
router.get('/:id', async (req, res) => {
  try {
    const caseDocRef = doc(db, 'cases', req.params.id)
    const caseDoc = await getDoc(caseDocRef)
    
    if (!caseDoc.exists()) {
      return res.status(404).json({ error: '找不到該案件' })
    }
    
    res.json({
      id: caseDoc.id,
      ...caseDoc.data()
    })
  } catch (error) {
    res.status(500).json({ error: '獲取案件資料失敗' })
  }
})

// 新增案件
router.post('/', async (req, res) => {
  try {
    const newCase = {
      ...req.body,
      createdAt: new Date()
    }
    
    const docRef = await addDoc(casesCollection, newCase)
    res.status(201).json({
      id: docRef.id,
      ...newCase
    })
  } catch (error) {
    res.status(500).json({ error: '新增案件失敗' })
  }
})

// 更新案件
router.put('/:id', async (req, res) => {
  try {
    const caseDocRef = doc(db, 'cases', req.params.id)
    await updateDoc(caseDocRef, req.body)
    res.json({ message: '更新成功' })
  } catch (error) {
    res.status(500).json({ error: '更新案件失敗' })
  }
})

// 刪除案件
router.delete('/:id', async (req, res) => {
  try {
    const caseDocRef = doc(db, 'cases', req.params.id)
    await deleteDoc(caseDocRef)
    res.json({ message: '刪除成功' })
  } catch (error) {
    res.status(500).json({ error: '刪除案件失敗' })
  }
})

export default router 