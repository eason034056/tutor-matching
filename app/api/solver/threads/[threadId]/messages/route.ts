import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebase-admin';
import type { ChatMessage } from '@/lib/types';

// 處理 GET 請求，取得某個 thread 的所有訊息
export async function GET(request: NextRequest, context: any) {
  try {
    // Next.js 14 動態 API Route 取得 params 的正確方式
    const { params } = await context;
    const threadId = params.threadId;
    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
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
    return NextResponse.json({ error: 'Failed to get messages', detail: String(error) }, { status: 500 });
  }
} 