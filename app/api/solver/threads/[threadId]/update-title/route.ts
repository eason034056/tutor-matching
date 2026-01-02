import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebase-admin';

// PUT /api/solver/threads/[threadId]/update-title
// 更新 thread 的標題
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const body = await request.json();
    const { userId, newTitle } = body;

    // 檢查必要欄位
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (!newTitle || newTitle.trim().length === 0) {
      return NextResponse.json({ error: 'newTitle is required and cannot be empty' }, { status: 400 });
    }
    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
    }

    // 驗證標題長度（不超過 50 個字）
    if (newTitle.trim().length > 50) {
      return NextResponse.json({ error: 'Title cannot exceed 50 characters' }, { status: 400 });
    }

    // 檢查 thread 是否存在
    const threadRef = adminDb.collection('chat_threads').doc(threadId);
    const threadDoc = await threadRef.get();

    if (!threadDoc.exists) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // 檢查用戶權限（確保只能修改自己的 thread）
    const threadData = threadDoc.data();
    if (threadData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized: You can only update your own threads' }, { status: 403 });
    }

    // 更新標題
    await threadRef.update({
      title: newTitle.trim(),
      lastUpdated: Date.now()
    });

    console.log('[Thread 標題已手動更新]:', {
      threadId,
      oldTitle: threadData?.title,
      newTitle: newTitle.trim()
    });

    return NextResponse.json({
      success: true,
      message: 'Title updated successfully',
      threadId,
      newTitle: newTitle.trim()
    });

  } catch (error) {
    console.error('[ERROR] Failed to update thread title:', error);
    return NextResponse.json(
      { error: 'Failed to update thread title', detail: String(error) },
      { status: 500 }
    );
  }
}

