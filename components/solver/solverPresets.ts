import type { SubjectType } from '@/components/solver/types'

const questionPresetsBySubject: Record<SubjectType, string[]> = {
  math: ['請教我這題', '請教我這題多選題', '請列出詳細步驟', '請解釋關鍵公式', '有其他解法嗎？', '請檢查我的計算'],
  other: ['請教我這題', '請教我這題多選題', '請用不同方法解釋', '請解釋關鍵概念', '這題的重點是什麼？', '有相關例子嗎？'],
}

const chatPresetsBySubject: Record<SubjectType, string[]> = {
  math: ['請教我這題', '請教我這題多選題', '請列出更詳細步驟', '請解釋關鍵公式', '如果我要把這題寫進筆記，該怎麼寫？', '有其他解法嗎？'],
  other: ['請教我這題', '請教我這題多選題', '請解釋關鍵概念', '請列出重點', '如果我要把這題寫進筆記，該怎麼寫？', '有相關例子嗎？'],
}

export const getQuestionPresets = (subjectType: SubjectType | null) =>
  subjectType ? questionPresetsBySubject[subjectType] : questionPresetsBySubject.other

export const getChatPresets = (subjectType: SubjectType | null) =>
  subjectType ? chatPresetsBySubject[subjectType] : chatPresetsBySubject.other
