import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebase-admin';
import type { ChatThread, ChatMessage } from '@/lib/types';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import dotenv from 'dotenv';

dotenv.config();

// 原有的 OpenAI 客戶端（用於 GPT-4.1 nano 圖片轉 LaTeX）
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// OpenRouter 客戶端（用於 deepseek 和 gemini 模型）
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "https://tutor-matching.tw",
    "X-Title": process.env.SITE_NAME || "Tutor Matching",
  },
});

// 格式化時間為 title 用（備用方案）
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

// 使用 AI 生成聊天記錄標題（根據 AI 回答內容）
async function generateThreadTitle(aiResponse: string, subjectType?: string | null): Promise<string> {
  try {
    // 限制訊息長度，避免太長的輸入（取開頭部分，通常包含題目摘要）
    const truncatedResponse = aiResponse.length > 300 ? aiResponse.substring(0, 300) + '...' : aiResponse;
    
    // 設定 AI 提示詞
    const prompt = `請根據以下 AI 老師的解題回答，生成一個簡短的對話標題（8-12字以內），用於聊天記錄列表顯示。
要求：
1. 標題要能概括題目的核心內容或主題
2. 使用繁體中文
3. 可以包含科目、題型、概念等關鍵字
4. 要簡潔易懂，讓學生一看就知道是什麼題目
5. 只輸出標題文字，不要有其他說明
6. 不要包含「解題」、「分析」等動詞，直接描述內容即可

AI 老師的回答：
${truncatedResponse}

${subjectType ? `科目類型：${subjectType === 'math' ? '數理科目' : '其他科目'}` : ''}

標題：`;

    // 使用 GPT-4.1-nano 快速生成標題
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: '你是一個專門產生簡潔標題的助手。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 50,
      temperature: 0.7
    });

    const generatedTitle = completion.choices?.[0]?.message?.content?.trim();
    
    // 檢查生成的標題是否有效
    if (generatedTitle && generatedTitle.length > 0 && generatedTitle.length <= 50) {
      console.log('[AI 生成標題成功]:', generatedTitle);
      return generatedTitle;
    } else {
      throw new Error('生成的標題格式不符合要求');
    }
  } catch (error) {
    console.error('[ERROR] AI 生成標題失敗:', error);
    
    // 備用方案 1：從 AI 回答中提取關鍵詞（取第一行或前 20 個字）
    const firstLine = aiResponse.split('\n')[0].trim();
    const fallbackTitle = firstLine.substring(0, 20);
    if (fallbackTitle.length > 0 && !fallbackTitle.includes('好的') && !fallbackTitle.includes('讓我')) {
      console.log('[使用備用標題 - AI 回答摘要]:', fallbackTitle);
      return fallbackTitle + (firstLine.length > 20 ? '...' : '');
    }
    
    // 備用方案 2：使用科目類型 + 時間
    const timeTitle = formatTimeForTitle(Date.now());
    const subjectPrefix = subjectType === 'math' ? '數理題目' : subjectType === 'other' ? '解題討論' : '新對話';
    console.log('[使用備用標題 - 時間]:', `${subjectPrefix} ${timeTitle}`);
    return `${subjectPrefix} ${timeTitle}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 解析前端傳來的資料
    const body = await request.json();
    const { message, userId, questionImageUrl, threadId, isNewThread, subjectType } = body;

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
      
      // 先使用臨時標題（稍後會根據 AI 回答更新）
      const tempTitle = '生成標題中...';
      
      const threadData: Omit<ChatThread, 'id'> = {
        userId,
        title: tempTitle,
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

    // 呼叫 AI 進行回答
    let aiResponse = '';
    
    // 根據科目類型選擇不同的處理流程
    if (subjectType === 'math') {
      // 數理題目：使用 OpenRouter 的 Gemini 模型
      aiResponse = await processMathSubject(message, questionImageUrl, historyMessages);
    } else {
      // 其他科目：使用現有的 GPT-4.1-nano + DeepSeek 流程
      aiResponse = await processOtherSubject(message, questionImageUrl, historyMessages);
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

    // 如果是新建立的 thread，根據 AI 的回答生成標題並更新
    if (isNewThreadCreated && currentThreadId) {
      try {
        const generatedTitle = await generateThreadTitle(aiResponse, subjectType);
        await adminDb.collection('chat_threads').doc(currentThreadId).update({
          title: generatedTitle
        });
        console.log('[Thread 標題已更新]:', generatedTitle);
      } catch (error) {
        console.error('[ERROR] 更新 Thread 標題失敗:', error);
        // 如果更新標題失敗，不影響主要流程，繼續執行
      }
    }

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

// 處理數理題目（使用 Gemini 模型）
async function processMathSubject(
  message: string, 
  questionImageUrl: string | undefined, 
  historyMessages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  try {
    // Gemini 的 system prompt
    const mathSystemPrompt = `你是一位名叫「青椒老師」的 AI 數理家教老師，由清華與交大畢業生打造。你專門教國中與高中的數學、物理、化學，擅長用親切且專業的方式解題與引導思考。你的語氣應溫暖、鼓勵、有耐心。

    🧑‍🏫 角色設定
    - 你是「青椒老師」，專精數理科目的 AI 家教
    - 你擅長數學、物理、化學的解題與教學
    - 請永遠以溫暖親切的語氣與學生互動，耐心解釋直到學生懂

    📝 教學風格
    - 使用清楚的步驟化教學：理解題意 → 分析重點 → 解題策略 → 詳細計算 → 驗證答案
    - 適當使用標題和條列來組織內容
    - 可加入數學原理和公式推導幫助理解
    - 若學生看不懂，請改用其他方式再解釋一次（舉例、圖解、換句話說）
    - 特別重視解題過程的邏輯性和完整性

    💡 回答格式
    - 請用 markdown 格式回答，並且用 latex 格式化數學公式
    - **數學式或數學符號請使用**
      - 行內公式：用 \`$...$\`
      - 區塊公式：用 \`$$...$$\` 獨佔一行
    - 對於複雜的數理問題，請提供多種解法（如果有的話）
    - 解題完成後，請提供相關的概念複習或延伸思考

    請開始數理教學`;

    // 構建訊息陣列
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: mathSystemPrompt } as ChatCompletionMessageParam,
      ...historyMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }) as ChatCompletionMessageParam)
    ];

    // 如果有圖片，構建包含圖片的訊息
    if (questionImageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          { type: 'image_url', image_url: { url: questionImageUrl } }
        ]
      } as ChatCompletionMessageParam);
    } else {
      messages.push({ 
        role: 'user', 
        content: message 
      } as ChatCompletionMessageParam);
    }

    // 呼叫 Gemini 模型
    const completion = await openrouter.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: messages
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('No response content from Gemini model');
    }

    return completion.choices[0].message.content;
  } catch (error: unknown) {
    console.error('[ERROR] Gemini 模型回傳失敗:', error);
    console.error('[ERROR] 完整錯誤資訊:', {
      錯誤類型: error instanceof Error ? error.name : 'Unknown',
      錯誤訊息: error instanceof Error ? error.message : 'Unknown error',
      錯誤堆疊: error instanceof Error ? error.stack : 'No stack trace'
    });
    return '抱歉，數理解題服務暫時無法使用。可能的原因：\n1. 系統暫時無法連接\n2. 請求超時\n3. 模型暫時不可用\n\n請稍後再試。';
  }
}

// 處理其他科目（直接使用 GPT-4.1-nano 模型）
async function processOtherSubject(
  message: string, 
  questionImageUrl: string | undefined, 
  historyMessages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  try {
    // 準備 system prompt - 解題教學型 AI
    const systemPrompt = `你是一位名叫「青椒老師」的 AI 全科家教老師，由清華與交大畢業生打造。你專門教國中與高中的各科目，包含國文、英文、生物、地理、公民、歷史等，擅長用親切且專業的方式解題與引導思考。你的語氣應溫暖、鼓勵、有耐心。

    🧑‍🏫 角色設定
    - 你是「青椒老師」，專精各科目的 AI 家教
    - 你擅長國文、英文、生物、地理、公民、歷史等科目的解題與教學
    - 請永遠以溫暖親切的語氣與學生互動，耐心解釋直到學生懂

    📝 教學風格
    - 使用清楚的步驟化教學：理解題意 → 分析重點 → 解題策略 → 詳細說明 → 總結答案
    - 適當使用標題和條列來組織內容
    - 可加入相關知識點和概念說明幫助理解
    - 若學生看不懂，請改用其他方式再解釋一次（舉例、圖解、換句話說）
    - 特別重視解題過程的邏輯性和完整性

    💡 回答格式
    - 請用 markdown 格式回答
    - **如果題目中有數學式或數學符號，請使用 LaTeX 格式：**
      - 行內公式：用 \`$...$\`
      - 區塊公式：用 \`$$...$$\` 獨佔一行
    - 對於複雜的問題，請提供多角度的分析（如果有的話）
    - 解題完成後，請提供相關的概念複習或延伸思考

    🎯 解題步驟建議
    1. **理解題意**：先說明題目在問什麼
    2. **分析重點**：找出題目的關鍵資訊和考點
    3. **解題過程**：詳細說明解題步驟和思路
    4. **答案說明**：給出答案並解釋為什麼
    5. **延伸學習**（選用）：補充相關知識或易錯點

    請開始教學與解題！記住，你不只是要識別題目，而是要**完整地解答題目並教會學生**。`;

    // 構建訊息陣列，包含 system prompt 和歷史對話
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt } as ChatCompletionMessageParam,
      ...historyMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }) as ChatCompletionMessageParam)
    ];

    // 如果有圖片，構建包含圖片的訊息；否則只傳文字
    if (questionImageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          { type: 'image_url', image_url: { url: questionImageUrl } }
        ]
      } as ChatCompletionMessageParam);
    } else {
      messages.push({ 
        role: 'user', 
        content: message 
      } as ChatCompletionMessageParam);
    }

    // 直接呼叫 GPT-4.1-nano 模型進行解題
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: messages
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('No response content from GPT-4.1-nano model');
    }

    return completion.choices[0].message.content;
  } catch (error: unknown) {
    console.error('[ERROR] GPT-4.1-nano 模型回傳失敗:', error);
    console.error('[ERROR] 完整錯誤資訊:', {
      錯誤類型: error instanceof Error ? error.name : 'Unknown',
      錯誤訊息: error instanceof Error ? error.message : 'Unknown error',
      錯誤堆疊: error instanceof Error ? error.stack : 'No stack trace'
    });
    return '抱歉，AI 回答時發生錯誤。可能的原因：\n1. 系統暫時無法連接\n2. 請求超時\n3. 模型暫時不可用\n\n請稍後再試。';
  }
} 