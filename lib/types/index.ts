import type { TutorRevisionReasonCode } from '@/lib/tutor-review'

export interface Tutor {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    subjects: string[];
    experience: string;
    school: string;
    major: string;
    expertise: string;
    tutorCode: string;
    status: 'pending' | 'revision_requested' | 'approved' | 'rejected';
    isActive: boolean; 
    studentIdCardUrl: string;
    idCardUrl: string;
    receiveNewCaseNotifications?: boolean;
    approvedAt?: string | null;
    revisionReasonCodes?: TutorRevisionReasonCode[];
    revisionNote?: string | null;
    revisionRequestedAt?: string | null;
    revisionTokenHash?: string | null;
    revisionExpiresAt?: string | null;
    revisionSubmittedAt?: string | null;
}

export interface ApprovedTutor {
    tutorId: string;
    tutorCode: string;
    experience: string;
    subjects: string[];
    expertise: string;
    major: string;
    name: string;
    email: string;
    school: string;
    approvedAt: string;
    receiveNewCaseNotifications?: boolean;
}

export interface TutorCase {
    id: string;
    caseNumber: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    address?: string;
    city?: string;
    district?: string;
    roadName?: string;
    landmark?: string;
    onlineDetail?: string;
    lessonMode?: 'in_person' | 'online';
    idNumber?: string;
    studentGender: string;
    lineId?: string;
    department: string;
    grade: string;
    studentDescription: string;
    subject: string;
    location: string;
    region: string;
    availableTime: string;
    teacherRequirements?: string;
    hourlyFee?: number | string;
    budgetRange?: string;
    message?: string;
    status: '急徵' | '已徵到' | '有人接洽';
    createdAt: string;
    pending: 'pending' | 'approved' | 'rejected';
    idCardUrl?: string;
    documentStatus?: 'not_requested' | 'requested' | 'submitted';
    documentRequestTokenHash?: string;
    documentRequestExpiresAt?: string;
    documentRequestedAt?: string;
    documentSubmittedAt?: string;
}

export interface ApprovedCase {
    caseId: string;
    caseNumber: string;
    subject: string;
    grade: string;
    location: string;
    availableTime: string;
    studentDescription: string;
    teacherRequirements?: string;
    hourlyFee?: number | string;
    budgetRange?: string;
    status: '急徵' | '已徵到' | '有人接洽';
    approvedAt: string;
    region: string;
    documentStatus?: 'not_requested' | 'requested' | 'submitted';
}

export interface Message {
  role: 'user' | 'assistant';
  content?: string;
  imageUrl?: string;
}

export interface SolverRequest {
  message: string;
  userId: string;
  threadId?: string;
  isNewThread?: boolean;
}

export interface SolverResponse {
  message: string;
  threadId: string;
  isNewThread: boolean;
  error?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: number | Date; // Firestore Timestamp 或 Date
  // ...其他欄位
}

export interface ChatHistory {
  userId: string;
  question?: string;
  answer?: string;
  questionImageUrl?: string;
  answerImageUrl?: string;
  timestamp: number | Date; // Firestore Timestamp 或 Date
}

// 新增的 Thread 相關類型
export interface ChatThread {
  id: string;
  userId: string;
  title: string;
  hasImage: boolean;
  createdAt: number | Date; // Firestore Timestamp 或 Date
  lastUpdated: number | Date; // Firestore Timestamp 或 Date
}

export interface ChatMessage {
  id: string;
  threadId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: number | Date; // Firestore Timestamp 或 Date
}

export interface ThreadListResponse {
  threads: ChatThread[];
  error?: string;
}

export interface ThreadMessagesResponse {
  messages: ChatMessage[];
  error?: string;
} 
