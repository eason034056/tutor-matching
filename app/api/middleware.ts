import { NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { initAdmin } from '../../server/config/firebase-admin';

// 初始化 Firebase Admin
initAdmin();

export async function validateToken(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: '未提供認證令牌' },
        { status: 401 }
      );
    }

    // 驗證 token
    const decodedToken = await auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: '無效的認證令牌' },
      { status: 401 }
    );
  }
}