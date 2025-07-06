import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebase-admin';
import type { ChatThread } from '@/lib/types';

// 處理 GET 請求，取得某個 user 的所有 thread
export async function GET(request: NextRequest) {
  try {
    // 從網址 query 取得 userId
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 查詢 firebase，找出這個 user 的所有 thread，依照最後更新時間排序
    const threadsQuery = adminDb
      .collection('chat_threads')
      .where('userId', '==', userId)
      .orderBy('lastUpdated', 'desc');
    const querySnapshot = await threadsQuery.get();
    const threads: ChatThread[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        hasImage: data.hasImage,
        createdAt: data.createdAt,
        lastUpdated: data.lastUpdated
      };
    });

    // 回傳 thread 陣列
    return NextResponse.json({ threads });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get threads', detail: String(error) }, { status: 500 });
  }
} 