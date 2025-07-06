'use server';

import { adminDb } from '@/lib/firebase/firebase-admin';
import type { ChatHistory, ChatThread, ChatMessage } from '@/lib/types/index';

export async function getChatHistoryAction(userId: string): Promise<ChatHistory[]> {
  console.log('[DEBUG] getChatHistoryAction called with userId:', userId);
  
  try {
    const chatHistoryRef = adminDb.collection('chat_history');
    const q = chatHistoryRef
      .where('userId', '==', userId)
      .orderBy('timestamp', 'asc');
    
    const querySnapshot = await q.get();
    console.log('[DEBUG] Found', querySnapshot.size, 'chat history records');
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        timestamp: data.timestamp && typeof data.timestamp.toDate === 'function'
          ? data.timestamp.toDate().getTime()
          : (data.timestamp?._seconds ? data.timestamp._seconds * 1000 : data.timestamp),
        question: data.question,
        answer: data.answer,
        questionImageUrl: data.questionImageUrl,
        answerImageUrl: data.answerImageUrl
      };
    }) as ChatHistory[];
  } catch (error) {
    console.error('[ERROR] Failed to get chat history:', error);
    throw new Error('Failed to get chat history');
  }
}

export async function getThreadsAction(userId: string): Promise<ChatThread[]> {
  console.log('[DEBUG] getThreadsAction called with userId:', userId);
  
  try {
    const threadsQuery = adminDb
      .collection('chat_threads')
      .where('userId', '==', userId)
      .orderBy('lastUpdated', 'desc');
    
    const querySnapshot = await threadsQuery.get();
    console.log('[DEBUG] Found', querySnapshot.size, 'threads');
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        hasImage: data.hasImage,
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
          ? data.createdAt.toDate().getTime()
          : (data.createdAt?._seconds ? data.createdAt._seconds * 1000 : data.createdAt),
        lastUpdated: data.lastUpdated && typeof data.lastUpdated.toDate === 'function'
          ? data.lastUpdated.toDate().getTime()
          : (data.lastUpdated?._seconds ? data.lastUpdated._seconds * 1000 : data.lastUpdated)
      };
    }) as ChatThread[];
  } catch (error) {
    console.error('[ERROR] Failed to get threads:', error);
    throw new Error('Failed to get threads');
  }
}

export async function getThreadMessagesAction(threadId: string, userId: string): Promise<ChatMessage[]> {
  console.log('[DEBUG] getThreadMessagesAction called with threadId:', threadId, 'userId:', userId);
  
  try {
    const threadRef = adminDb.collection('chat_threads').doc(threadId);
    const threadDoc = await threadRef.get();
    
    if (!threadDoc.exists) {
      throw new Error('Thread not found');
    }

    const threadData = threadDoc.data();
    if (threadData?.userId !== userId) {
      throw new Error('Unauthorized access to thread');
    }

    const messagesQuery = adminDb
      .collection('chat_messages')
      .where('threadId', '==', threadId)
      .orderBy('timestamp', 'asc');
    
    const querySnapshot = await messagesQuery.get();
    console.log('[DEBUG] Found', querySnapshot.size, 'messages in thread');
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        threadId: data.threadId,
        userId: data.userId,
        role: data.role,
        content: data.content,
        imageUrl: data.imageUrl,
        timestamp: data.timestamp && typeof data.timestamp.toDate === 'function'
          ? data.timestamp.toDate().getTime()
          : (data.timestamp?._seconds ? data.timestamp._seconds * 1000 : data.timestamp)
      };
    }) as ChatMessage[];
  } catch (error) {
    console.error('[ERROR] Failed to get thread messages:', error);
    throw new Error('Failed to get thread messages');
  }
} 