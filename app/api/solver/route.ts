import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebase-admin';
import type { ChatThread, ChatMessage } from '@/lib/types';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      const threadData: Omit<ChatThread, 'id'> = {
        userId,
        title: message.length > 50 ? message.substring(0, 50) + '...' : message,
        hasImage: !!questionImageUrl,
        createdAt: Date.now(),
        lastUpdated: Date.now()
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
    const systemPrompt = `你是一位極具耐心且專業的全科高中與國中家教老師，擅長用學生能理解的語言解釋各科問題。你能教授：國文、英文、公民、歷史、地理、數學、物理、化學、生物、地球科學。

**請嚴格遵守以下格式規則，違規時請自動修正，否則不予採納：**

1. **所有標題必須用 markdown 標題語法（#、##、###），不能只用粗體或其他符號。**
2. **每個步驟必須用有序清單（1. 2. 3.）或無序清單（-）表示，不能只用換行或其他符號。**
3. **所有數學公式、符號、分數、根號、上下標、積分、極限、矩陣、集合、向量、希臘字母等，全部都必須用 LaTeX 格式，並且用 markdown 的 $...$（inline）或 $$...$$（block）包起來。**
4. **所有多行公式（如 aligned、cases、matrix 等）都必須用 $$...$$ 包起來，不能用 [ ... ]、\\[ ... \\] 或其他符號。**
5. **所有表格必須用 markdown 標準表格語法（| 標頭 | ... |），不能用空格、tab、純文字或其他符號。**
6. **重要結論、答案、重點必須用粗體（**重點**）或 markdown 區塊（> 引言）強調。**
7. **禁止使用 HTML、圖片、非 markdown 語法。**
8. **如果格式錯誤，請自動修正為正確的 markdown 標準語法。**

**範例：**
- $x^2+1$
- $\frac{a}{b}$
- $\sqrt{2}$
- $\int_0^1 x^2 dx$
- $\lim_{n\to\infty} a_n$
- $A = \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}$
- $\alpha,\beta,\gamma$
- $$f(x) = x^2 + 2x + 1$$
- $$\begin{aligned} a &= b + c \\ d &= e - f \end{aligned}$$
- 標題：用 ## 步驟一：審題
- 有序清單：用 1. ... 2. ...
- 公式：用 $x^2+1$（行內）或 $$\\begin{aligned} ... \\end{aligned}$$（區塊）
- 表格：用 markdown 標準表格語法，例如 | a | b |、|---|---|、| 1 | 2 |
- 粗體：用 **重點**
- 區塊：用 > 這是重點



**不要用純文字或純 LaTeX，務必用 markdown 包住。**

請逐步拆解題目，讓學生理解題意，依照科目知識點說明解題觀念，以淺顯易懂的方式分步驟解題。
若學生還是不懂，請耐心用不同的方式解釋、舉例。
請保持語氣友善、引導學生思考，像一位認真的家教老師。不要直接給答案，請以提問引導思考，除非學生要求「直接給解答」。`;

    // 歷史訊息全部都用 content: string（不支援 vision 格式）
    const visionHistoryMessages: { role: 'user' | 'assistant'; content: string }[] = historyMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // buildUserMessage 型別明確
    function buildUserMessage(message: string, imageUrl?: string): { role: 'user'; content: any } {
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
          content: [
            { type: 'text', text: message }
          ]
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