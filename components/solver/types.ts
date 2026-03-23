import type { ChatThread, Message } from '@/lib/types'

export type SolverPageState = 'home' | 'question' | 'chat'
export type SubjectType = 'math' | 'other'

export interface MessageWithMeta extends Message {
  timestamp?: number
  responseTime?: number
}

export interface SolverRequestData {
  message: string
  userId: string
  threadId?: string | null
  questionImageUrl?: string
  isNewThread?: boolean
  subjectType?: SubjectType | null
}

export interface RetryRequest {
  type: 'question' | 'chat'
  data: SolverRequestData
}

export interface ThreadMessagePayload {
  role: string
  content: string
  imageUrl?: string
}

export interface ThreadMessagesApiResponse {
  messages?: ThreadMessagePayload[]
  error?: string
}

export interface ThreadsApiResponse {
  threads?: ChatThread[]
  error?: string
}
