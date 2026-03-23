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

function createThreadTitleFromMessage(message: string, timestamp: number): string {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return formatTimeForTitle(timestamp);
  }

  const MAX_LENGTH = 26;
  if (normalized.length <= MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_LENGTH)}…`;
}

function createFallbackTitleFromFirstAnswer(firstAssistantAnswer: string, userMessage: string, timestamp: number): string {
  const normalizedAnswer = firstAssistantAnswer
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalizedAnswer) {
    return createThreadTitleFromMessage(userMessage, timestamp);
  }

  const MAX_LENGTH = 26;
  if (normalizedAnswer.length <= MAX_LENGTH) {
    return normalizedAnswer;
  }

  return `${normalizedAnswer.slice(0, MAX_LENGTH)}…`;
}

function normalizeGeneratedTitle(rawTitle: string, timestamp: number): string {
  const normalized = rawTitle
    .replace(/^標題[:：]\s*/i, '')
    .replace(/[`"'「」]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return formatTimeForTitle(timestamp);
  }

  const MAX_LENGTH = 26;
  if (normalized.length <= MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_LENGTH)}…`;
}

async function generateThreadTitleWithDeepSeek(
  userMessage: string,
  firstAssistantAnswer: string,
  timestamp: number
): Promise<string> {
  const fallbackTitle = createFallbackTitleFromFirstAnswer(firstAssistantAnswer, userMessage, timestamp);
  if (!firstAssistantAnswer.trim()) {
    return fallbackTitle;
  }

  try {
    const completion = await openrouter.chat.completions.create({
      model: 'deepseek/deepseek-chat-v3-0324',
      temperature: 0.2,
      max_tokens: 48,
      messages: [
        {
          role: 'system',
          content:
            '你是標題助手。請根據「第一則 AI 回答」產生一個繁體中文對話標題。規則：不超過16字、不可換行、不加引號、不加句號、不要輸出任何前綴。只輸出標題本身。',
        },
        {
          role: 'user',
          content: `使用者提問：${userMessage}\n\n第一則 AI 回答：${firstAssistantAnswer}`,
        },
      ],
    });

    const rawTitle = completion.choices?.[0]?.message?.content ?? '';
    if (!rawTitle) {
      return fallbackTitle;
    }

    return normalizeGeneratedTitle(rawTitle, timestamp);
  } catch (error) {
    console.error('[WARN] DeepSeek thread title generation failed, fallback to local title:', error);
    return fallbackTitle;
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
    let threadCreatedAt: number | null = null;

    // 如果沒有 threadId 或是新 thread，建立一個新的 thread
    if (isNewThread || !threadId) {
      const createdAt = Date.now();
      threadCreatedAt = createdAt;
      const threadData: Omit<ChatThread, 'id'> = {
        userId,
        title: createThreadTitleFromMessage(message, createdAt),
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

    // 新對話在拿到第一則 AI 回答後，再用 DeepSeek 生成正式 title
    if (isNewThreadCreated && currentThreadId && threadCreatedAt) {
      try {
        const generatedTitle = await generateThreadTitleWithDeepSeek(message, aiResponse, threadCreatedAt);
        await adminDb.collection('chat_threads').doc(currentThreadId).update({
          title: generatedTitle,
          lastUpdated: Date.now()
        });
      } catch (titleError) {
        console.error('[WARN] Failed to update thread title from first assistant answer:', titleError);
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

// 處理其他科目（使用現有的 GPT-4.1-nano + DeepSeek 流程）
async function processOtherSubject(
  message: string, 
  questionImageUrl: string | undefined, 
  historyMessages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  try {
    // 準備 system prompt
    const systemPrompt = `你是一位由清大與交大團隊訓練的題目識別 AI，專門處理拍照上傳的國中與高中各科題目圖片，將其轉換為 Markdown 格式純文字，方便教師或學生閱讀與整理筆記。

      🎯 你的任務是：
      將圖片中的題目內容，**不加一字刪減或改寫**，完整轉換為 Markdown 格式的文字輸出，包含所有可辨識的內容：題目敘述、公式、符號、圖表說明、選項、標題等。

      ---

      📌 **請嚴格遵守以下格式規則：**

      1. **數學與理化公式：**
        - 所有 LaTeX 符號與公式必須使用 \`$...$\`（行內）或 \`$$...$$\`（區塊）包裹
        - 禁止裸露 LaTeX 指令（例如：\`\\frac{a}{b}\` → ❌，\`$\\frac{a}{b}$\` → ✅）

      2. **標題與段落：**
        - 若題目中有章節或大標題，使用 \`##\` 或 \`###\` 標示
        - 段落之間請保留空行，保持可讀性

      3. **選項格式（如選擇題）：**
        - 使用 \`- (A) 選項內容\` 的格式呈現

      4. **圖形與圖表：**
        - 若圖片中有圖形或表格，請使用「文字敘述」的方式轉述其結構與內容（如："圖中顯示一個等腰三角形 ABC，∠A 為 40°..."）

      5. **只輸出題目內容，不要加入任何說明或標記你的身份**  
        - 無需加入「轉換完成」、「以下是結果」等多餘說明

      ---

      📄 **範例輸出格式：**

      \`\`\`markdown
      題目：求解以下方程式  
      $x^2 + 3x - 4 = 0$

      - (A) $x = -4, 1$
      - (B) $x = -2, 2$
      - (C) $x = -1, 4$
      - (D) $x = -1, -4$
      \`\`\`

      ---

      ✅ 請使用 \`\`\`markdown 開頭與 \`\`\` 結尾包住整段輸出。  
      ✅ 回傳內容請完全比照題目原始格式，不要省略題號、選項或標點。

      📌 **科目可能包含：數學、物理、化學、生物、地理、公民、國文、英文等。你必須具備辨識這些科目的能力。**

      請開始轉換。輸出僅包含純文字 Markdown 題目內容，其他說明一律禁止。
      `;

    // 如果有圖片，先用 GPT-4.1-nano 轉換為 LaTeX
    let processedMessage = message;
    if (questionImageUrl) {
      try {
        const imageToLatexCompletion = await openai.chat.completions.create({
          model: 'gpt-4.1-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: questionImageUrl } }
              ]
            }
          ]
        });
        const latexContent = imageToLatexCompletion.choices[0].message.content || '';
        
        // 記錄 GPT-4.1-nano 的圖片轉換結果
        console.log('[GPT-4.1-nano 圖片轉換結果]:', {
          圖片網址: questionImageUrl,
          轉換結果: latexContent
        });
        
        // 將用戶文字和轉換後的 LaTeX 組合
        processedMessage = `${message}\n\n圖片中的題目：\n${latexContent}`;
      } catch (e) {
        console.error('[ERROR] 圖片轉 LaTeX 失敗:', e);
        // 如果轉換失敗，使用原始訊息
        processedMessage = message;
      }
    }

    // 歷史訊息全部都用 content: string（不支援 vision 格式）
    const visionHistoryMessages: { role: 'user' | 'assistant'; content: string }[] = historyMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // 呼叫 deepseek 模型進行答題（使用處理後的純文字訊息）
    const completion = await openrouter.chat.completions.create({
      model: 'deepseek/deepseek-chat-v3-0324',
      messages: [
        { role: 'system', content: systemPrompt },
        ...visionHistoryMessages,
        { role: 'user', content: processedMessage }
      ]
    });

    if (!completion.choices?.[0]?.message?.content) {
      throw new Error('No response content from DeepSeek model');
    }

    return completion.choices[0].message.content;
  } catch (error: unknown) {
    console.error('[ERROR] DeepSeek 模型回傳失敗:', error);
    console.error('[ERROR] 完整錯誤資訊:', {
      錯誤類型: error instanceof Error ? error.name : 'Unknown',
      錯誤訊息: error instanceof Error ? error.message : 'Unknown error',
      錯誤堆疊: error instanceof Error ? error.stack : 'No stack trace'
    });
    return '抱歉，AI 回答時發生錯誤。可能的原因：\n1. 系統暫時無法連接\n2. 請求超時\n3. 模型暫時不可用\n\n請稍後再試。';
  }
} 
