import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebase-admin';
import type { ChatThread, ChatMessage } from '@/lib/types';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 格式化時間為 title 用
function formatTimeForTitle(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    // 24小時內顯示時間
    return date.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } else if (diffInHours < 24 * 7) {
    // 一週內顯示 月/日 時間
    return date.toLocaleString('zh-TW', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } else {
    // 超過一週顯示完整日期
    return date.toLocaleString('zh-TW', { 
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 解析前端傳來的資料
    const body = await request.json();
    const { message, userId, questionImageUrl, threadId, isNewThread } = body;

    // 檢查必要欄位
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    let currentThreadId = threadId;
    let isNewThreadCreated = false;

    // 如果沒有 threadId 或是新 thread，建立一個新的 thread
    if (isNewThread || !threadId) {
      const createdAt = Date.now();
      const threadData: Omit<ChatThread, 'id'> = {
        userId,
        title: formatTimeForTitle(createdAt),
        hasImage: !!questionImageUrl,
        createdAt,
        lastUpdated: createdAt
      };
      const threadRef = await adminDb.collection('chat_threads').add(threadData);
      currentThreadId = threadRef.id;
      isNewThreadCreated = true;
    } else {
      // 如果是舊 thread，更新最後更新時間
      await adminDb.collection('chat_threads').doc(threadId).update({
        lastUpdated: Date.now()
      });
    }

    // 準備要存進 firebase 的 user 訊息
    const userMessageData: Omit<ChatMessage, 'id'> = {
      threadId: currentThreadId,
      userId,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    // 只有有圖片時才加 imageUrl 欄位
    if (questionImageUrl) {
      userMessageData.imageUrl = questionImageUrl;
    }
    await adminDb.collection('chat_messages').add(userMessageData);

    // 查詢這個 thread 的所有訊息（只要 user/assistant），依照時間排序
    let historyMessages: { role: 'user' | 'assistant'; content: string }[] = [];
    let threadMessages: ChatMessage[] = [];
    if (currentThreadId) {
      const messagesQuery = adminDb
        .collection('chat_messages')
        .where('threadId', '==', currentThreadId)
        .orderBy('timestamp', 'asc');
      const querySnapshot = await messagesQuery.get();
      threadMessages = querySnapshot.docs.map(doc => {
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
      // 只帶 user/assistant 給 openai
      historyMessages = threadMessages
        .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
        .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content as string }));
    }

    // 準備 system prompt
    const systemPrompt = `你是一位名叫「青椒老師」的 AI 家教老師，由清華與交大畢業生打造。你專門教國中與高中生，擅長用親切且專業的方式解題與引導思考。你的語氣應溫暖、鼓勵、有耐心，像一位真實的家教老師。

    ⚠️ 回答時必須 **嚴格遵守以下格式規則**，否則系統將視為不合格回答。
    
    【數學公式格式】
    1. 行內公式請用 $公式$ 包住，例如：$a^2 + b^2 = c^2$
    2. 區塊公式請用 $$公式$$ 包住，例如：
       $$
       F = ma
       $$
    3. 多行公式請使用：
       $$
       \\begin{aligned}
       x &= 1 \\\\
       y &= 2
       \\end{aligned}
       $$
    
    🚫 絕對禁止出現：
    - 裸露公式（例：x^2、1+1=2）
    - 裸露 LaTeX 語法（例：\\frac{a}{b}）
    - aligned 環境未包在 $$ 中
    
    【標題格式】
    - 使用 ## 或 ### 開頭
    - 主標題格式：## 步驟一：理解題意
    - 子標題格式：### 詳細說明
    
    【列表與強調格式】
    - 有序列表用：1. 2. 3.
    - 無序列表用：- 
    - 強調用 **粗體**
    - 引導提示請用：> 提示內容
    
    【回答流程與風格】
    - 請使用步驟教學，從題意、公式、代入、結論一步步說明
    - 如果學生沒有要求直接給答案，請優先使用提問與引導
    - 可加入生活化舉例輔助說明
    - 學生若聽不懂，請嘗試換句話說、重新拆解、舉例或圖解
    
    🎯 回答前請自我檢查以下 5 點是否都正確：
    1. 所有公式是否有加 $ 或 $$
    2. 所有標題是否有用 ## 或 ###
    3. 是否使用正確的列表格式
    4. 是否完全沒有裸露的 LaTeX
    5. 是否清楚分步驟、有教學邏輯
    
    🧑‍🏫 角色設定
    - 你是「青椒老師」，絕不是 ChatGPT
    - 你能教授所有高中國中科目：數學、物理、化學、生物、地理、公民、國文、英文等
    - 請永遠用溫暖親切的口吻與學生互動，耐心解釋直到學生懂
    
    請開始解題，並嚴格依照以上格式與身份進行。\``;

    // 歷史訊息全部都用 content: string（不支援 vision 格式）
    const visionHistoryMessages: { role: 'user' | 'assistant'; content: string }[] = historyMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // buildUserMessage 型別明確
    type UserMessageContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
    
    function buildUserMessage(message: string, imageUrl?: string): { role: 'user'; content: UserMessageContent } {
      if (imageUrl) {
        return {
          role: 'user',
          content: [
            { type: 'text', text: message },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        };
      } else {
        return {
          role: 'user',
          content: message
        };
      }
    }

    // 呼叫 openai vision 模型，只有本次 user 訊息用 vision 格式
    let aiResponse = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'o4-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...visionHistoryMessages,
          buildUserMessage(message, questionImageUrl)
        ]
      });
      aiResponse = completion.choices[0].message.content || 'AI 沒有回應內容';
    } catch (e) {
      console.error('[ERROR] openai 回傳失敗:', e);
      aiResponse = 'AI 回答失敗，請稍後再試';
    }

    // 把 AI 回覆也存到 firebase
    const aiMessageData: Omit<ChatMessage, 'id'> = {
      threadId: currentThreadId,
      userId,
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now()
    };
    await adminDb.collection('chat_messages').add(aiMessageData);

    // 回傳 AI 回覆、threadId、是否新 thread、完整 thread 訊息
    return NextResponse.json({
      message: aiResponse,
      threadId: currentThreadId,
      isNewThread: isNewThreadCreated,
      threadMessages
    });
  } catch (error) {
    console.error('[ERROR] Failed to process solver request:', error);
    return NextResponse.json({ error: 'Failed to process request', detail: String(error) }, { status: 500 });
  }
} 