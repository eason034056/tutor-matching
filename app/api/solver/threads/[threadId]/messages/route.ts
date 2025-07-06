import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebase-admin';
import type { ChatMessage } from '@/lib/types';

// 處理 GET 請求，取得某個 thread 的所有訊息
export async function GET(request: NextRequest, context: { params: Promise<{ threadId: string }> }) {
  try {
    // Next.js 14 動態 API Route 取得 params 的正確方式
    const params = await context.params;
    const threadId = params.threadId;
    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
    }

    // 從網址 query 取得 userId
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 先檢查 thread 是否屬於該用戶
    const threadDoc = await adminDb.collection('chat_threads').doc(threadId).get();
    if (!threadDoc.exists) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }
    
    const threadData = threadDoc.data();
    if (threadData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 查詢 firebase，找出這個 thread 的所有訊息，依照時間排序
    const messagesQuery = adminDb
      .collection('chat_messages')
      .where('threadId', '==', threadId)
      .orderBy('timestamp', 'asc');
    const querySnapshot = await messagesQuery.get();
    const messages: ChatMessage[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        threadId: data.threadId,
        userId: data.userId,
        role: data.role,
        content: data.content,
        imageUrl: data.imageUrl,
        timestamp: data.timestamp
      };
    });

    // 回傳訊息陣列
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[ERROR] Failed to get messages:', error);
    return NextResponse.json({ error: 'Failed to get messages', detail: String(error) }, { status: 500 });
  }
} 