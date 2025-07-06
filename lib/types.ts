export interface ChatHistory {
  id?: string;
  userId: string;
  timestamp: number;
  question: string;
  answer: string;
  questionImageUrl?: string;
  answerImageUrl?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content?: string;
  imageUrl?: string;
}

// 新的 Thread 相關類型
export interface ChatThread {
  id: string;
  userId: string;
  title: string;
  hasImage: boolean;
  createdAt: number;
  lastUpdated: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: number;
}

// 前端狀態管理
export interface SolverState {
  currentThreadId: string | null;
  threads: ChatThread[];
  messages: ChatMessage[];
  loading: boolean;
  showThreadList: boolean;
}

export interface SolverRequest {
  message?: string;
  userId?: string;
  questionImageUrl?: string;
  threadId?: string;
  isNewThread?: boolean;
}

export interface SolverResponse {
  message: string;
  threadId?: string;
  isNewThread?: boolean;
} 