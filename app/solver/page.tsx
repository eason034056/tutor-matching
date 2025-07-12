'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Camera, 
  Upload, 
  Send, 
  ArrowLeft, 
  ChevronDown, 
  RefreshCw, 
  Plus,
  Image as ImageIcon,
  MessageSquare,
  Clock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import type { ChatThread, Message } from '@/lib/types';
import CropperPage from '@/components/CropperPage';

// 定義頁面狀態類型
type PageState = 'home' | 'question' | 'chat';

function fixLatexBlocks(text: string) {
  // 將 [ \begin{...} ... \end{...} ] 轉成 $$...$$
  return text.replace(/\[\s*(\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\})\s*\]/g, (_, inner) => `$$${inner}$$`);
}

export default function SolverPage() {
  const { user, loading: authLoading } = useAuth();
  const [pageState, setPageState] = useState<PageState>('home');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Thread 相關狀態
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [showThreadList, setShowThreadList] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 在 SolverPage 組件內部 state 加入：
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // 載入 Thread 列表
  const loadThreads = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('載入 threads 列表');
      const response = await fetch(`/api/solver/threads?userId=${user.uid}`);
      console.log('Threads API 回應狀態:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('載入到的 threads 數量:', data.threads?.length || 0);
        setThreads(data.threads || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Threads API 錯誤:', response.status, errorData);
        alert('載入對話列表失敗：' + (errorData.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
      alert('載入對話列表失敗，請稍後再試');
    }
  }, [user]);

  // 檢查用戶是否已登入
  useEffect(() => {
    // 如果認證還在載入中，不要做任何重定向
    if (authLoading) {
      return;
    }
    
    // 如果認證載入完成但沒有用戶，導向到登入頁面
    if (!user) {
      window.location.href = '/solver/auth/login';
      return;
    }
    
    // 如果有用戶，載入 Thread 列表
    loadThreads();
  }, [user, authLoading, loadThreads]);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 載入特定 Thread 的訊息
  const loadThreadMessages = async (threadId: string) => {
    if (!user) return;
    
    try {
      console.log('載入 thread 訊息:', threadId);
      const response = await fetch(`/api/solver/threads/${threadId}/messages?userId=${user.uid}`);
      console.log('API 回應狀態:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('載入到的訊息數量:', data.messages?.length || 0);
        
        // 將 ChatMessage 轉換為 Message
        const convertedMessages: Message[] = (data.messages || []).map((msg: { role: string; content: string; imageUrl?: string }) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          imageUrl: msg.imageUrl
        }));
        
        setMessages(convertedMessages);
        setCurrentThreadId(threadId);
        setPageState('chat');
        // 手機自動收起側邊欄
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          setShowThreadList(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 錯誤:', response.status, errorData);
        alert('載入聊天記錄失敗：' + (errorData.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('Failed to load thread messages:', error);
      alert('載入聊天記錄失敗，請稍後再試');
    }
  };

  // 處理拍照
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  // 處理相簿上傳
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 處理檔案選擇
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const originalDataUrl = ev.target?.result as string;
        // 壓縮圖片
        const compressImage = async (dataUrl: string, quality = 0.7, maxSize = 1000): Promise<string> => {
          return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
              let { width, height } = img;
              if (width > maxSize || height > maxSize) {
                if (width > height) {
                  height = Math.round((height * maxSize) / width);
                  width = maxSize;
                } else {
                  width = Math.round((width * maxSize) / height);
                  height = maxSize;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
              resolve(compressedDataUrl);
            };
            img.src = dataUrl;
          });
        };
        // log 壓縮前
        console.log('[圖片壓縮] 原始 base64 長度:', originalDataUrl.length);
        console.log('[圖片壓縮] 原始大約大小(KB):', Math.round((originalDataUrl.length * 3 / 4) / 1024));
        const compressedDataUrl = await compressImage(originalDataUrl);
        // log 壓縮後
        console.log('[圖片壓縮] 壓縮後 base64 長度:', compressedDataUrl.length);
        console.log('[圖片壓縮] 壓縮後大約大小(KB):', Math.round((compressedDataUrl.length * 3 / 4) / 1024));
        setCropImage(compressedDataUrl);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理問題提交
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== handleQuestionSubmit 開始 ===');
    console.log('currentQuestion.trim():', currentQuestion.trim());
    console.log('currentQuestion.trim() 長度:', currentQuestion.trim().length);
    console.log('imagePreview:', imagePreview);
    console.log('loading:', loading);
    console.log('user:', user);
    console.log('!currentQuestion.trim():', !currentQuestion.trim());
    console.log('!imagePreview:', !imagePreview);
    console.log('!currentQuestion.trim() || !imagePreview || loading || !user:', !currentQuestion.trim() || !imagePreview || loading || !user);
    
    if (!currentQuestion.trim() || !imagePreview || loading || !user) {
      console.log('條件檢查失敗，函式提前結束');
      return;
    }

    const startTime = Date.now(); // 記錄開始時間
    setLoading(true);
    setPageState('chat');
    // 手機自動收起側邊欄
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowThreadList(false);
    }

    // 1. 送出時馬上顯示自己的訊息
    const userMessage: Message = {
      role: 'user',
      content: currentQuestion,
      imageUrl: imagePreview
    };
    console.log('送出用戶訊息前，當前 messages 數量:', messages.length);
    setMessages(prev => {
      console.log('setMessages 被呼叫，prev 長度:', prev.length);
      const newMessages = [...prev, userMessage];
      console.log('新的 messages 長度:', newMessages.length);
      return newMessages;
    });

    try {
      const response = await fetch('/api/solver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentQuestion,
          userId: user.uid,
          questionImageUrl: imagePreview,
          isNewThread: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const endTime = Date.now(); // 記錄結束時間
        console.log('[AI 回應時間] handleQuestionSubmit 花費秒數:', ((endTime - startTime) / 1000).toFixed(2), '秒');
        console.log('API 回傳:', data);
        if (data.error) {
          alert('API 錯誤：' + data.error);
          return;
        }
        // 2. 等 AI 回覆後 append 到畫面
        const aiMessage: Message = {
          role: 'assistant',
          content: data.message
        };
        setMessages(prev => [...prev, aiMessage]);
        setCurrentThreadId(data.threadId);
        await loadThreads();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理聊天輸入提交
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== handleChatSubmit 開始 ===');
    console.log('input.trim():', input.trim());
    console.log('input.trim() 長度:', input.trim().length);
    console.log('loading:', loading);
    console.log('user:', user);
    console.log('!input.trim():', !input.trim());
    console.log('!input.trim() || loading || !user:', !input.trim() || loading || !user);
    
    if (!input.trim() || loading || !user) {
      console.log('條件檢查失敗，函式提前結束');
      return;
    }

    const startTime = Date.now(); // 記錄開始時間
    const message = input.trim();
    setInput('');
    setLoading(true);
    // 手機自動收起側邊欄（如果有切換 chat 狀態）
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowThreadList(false);
    }

    // 1. 送出時馬上顯示自己的訊息
    const userMessage: Message = {
      role: 'user',
      content: message
    };
    console.log('送出用戶訊息前，當前 messages 數量:', messages.length);
    setMessages(prev => {
      console.log('setMessages 被呼叫，prev 長度:', prev.length);
      const newMessages = [...prev, userMessage];
      console.log('新的 messages 長度:', newMessages.length);
      return newMessages;
    });

    try {
      const response = await fetch('/api/solver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userId: user.uid,
          threadId: currentThreadId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const endTime = Date.now(); // 記錄結束時間
        console.log('[AI 回應時間] handleChatSubmit 花費秒數:', ((endTime - startTime) / 1000).toFixed(2), '秒');
        console.log('API 回傳:', data);
        if (data.error) {
          alert('API 錯誤：' + data.error);
          return;
        }
        // 2. 等 AI 回覆後 append 到畫面
        const aiMessage: Message = {
          role: 'assistant',
          content: data.message
        };
        setMessages(prev => [...prev, aiMessage]);
        await loadThreads();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 回到首頁
  const goToHome = () => {
    setPageState('home');
    setImagePreview(null);
    setCurrentQuestion('');
    setMessages([]);
    setCurrentThreadId(null);
  };

  // 回到提問頁
  const goToQuestion = () => {
    setPageState('question');
  };

  // 開始新對話
  const startNewThread = () => {
    setPageState('home');
    setImagePreview(null);
    setCurrentQuestion('');
    setMessages([]);
    setCurrentThreadId(null);
  };

  // 格式化時間
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
    }
  };

  // 如果認證還在載入中，顯示載入狀態
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">檢查登入狀態...</p>
        </div>
      </div>
    );
  }

  // 如果沒有登入，顯示載入中（會自動重定向）
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">重定向到登入頁面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* 手機版遮罩 */}
      {showThreadList && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setShowThreadList(false)}
        />
      )}
      <div
        className={
          `${showThreadList ? 'block' : 'hidden'}
          md:fixed md:top-0 md:left-0 md:h-screen md:w-80 md:block
          fixed top-0 left-0 w-full h-full z-50 bg-white border-r border-gray-200 flex flex-col
          md:z-30`
        }
        style={{ maxWidth: '20rem' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">解題助手</h1>
            <Button 
              onClick={startNewThread}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              新對話
            </Button>
          </div>
        </div>

        {/* Thread 列表 */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>還沒有對話記錄</p>
              <p className="text-sm">開始你的第一個解題對話吧！</p>
            </div>
          ) : (
            <div className="p-2">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => loadThreadMessages(thread.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentThreadId === thread.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {thread.hasImage ? (
                      <ImageIcon className="w-4 h-4 mt-1 text-blue-500 flex-shrink-0" />
                    ) : (
                      <MessageSquare className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {thread.title}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(thread.lastUpdated)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 主內容區域 */}
      <div className="flex-1 flex flex-col h-screen max-h-screen bg-white md:ml-80">
        {/* 手機版 Header */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setShowThreadList(!showThreadList)}
              className="mr-3"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showThreadList ? 'rotate-180' : ''}`} />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">解題助手</h1>
            <Button 
              onClick={startNewThread}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 首頁 - 拍照/上傳選擇 */}
        {pageState === 'home' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
              {/* 拍照/上傳按鈕 */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleCameraClick}
                  className="flex-1 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  拍照
                </Button>
                <Button 
                  onClick={handleUploadClick}
                  className="flex-1 h-16 bg-green-500 hover:bg-green-600 text-white rounded-xl"
                >
                  <Upload className="w-6 h-6 mr-2" />
                  上傳
                </Button>
              </div>

              {/* 隱藏的檔案輸入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e)}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e)}
              />

              {/* 分隔線 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">使用範例</span>
                </div>
              </div>

              {/* 使用範例 */}
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">▸</span>
                  <span>拍下題目圖片 → 輸入「這題怎麼解？」</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">▸</span>
                  <span>選擇相簿圖片 → 輸入「請幫我找關鍵字」</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 提問頁 - 圖片預覽 + 問題輸入 */}
        {pageState === 'question' && (
          <div className="flex-1 flex flex-col h-screen max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 z-10 flex-shrink-0">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  onClick={goToHome}
                  className="mr-3"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold text-gray-900">輸入問題</h1>
              </div>
            </div>

            {/* 主要內容 */}
            <div className="flex-1 p-4">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* 圖片預覽 */}
                {imagePreview && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={imagePreview} 
                        alt="題目圖片" 
                        className="w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          window.open(imagePreview, '_blank');
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* 問題輸入 */}
                <form onSubmit={handleQuestionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      請輸入你對這張圖片的問題
                    </label>
                    <Textarea
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      placeholder="例如：這題怎麼解？請幫我分析關鍵字..."
                      className="min-h-[100px] resize-none"
                      disabled={loading}
                    />
                    {/* 預設問題按鈕區塊 */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['這題怎麼解？', '請幫我分析關鍵字', '請用不同方法解釋', '請列出詳細步驟', '請解釋為什麼這樣算'].map((preset, idx) => (
                        <Button
                          key={idx}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setCurrentQuestion(preset)}
                          disabled={loading}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={loading || !currentQuestion.trim()}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        處理中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        送出
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 聊天詳情頁 */}
        {pageState === 'chat' && (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 z-10 flex-shrink-0">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  onClick={goToQuestion}
                  className="mr-3"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold text-gray-900">解題對話</h1>
              </div>
            </div>

            {/* 聊天記錄區域 */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-28">
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-8 mb-6">
                        <div className="prose prose-lg max-w-none katex-math-render space-y-4">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {fixLatexBlocks(message.content || "")}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={
                          `max-w-[80%] bg-blue-500 text-white rounded-2xl rounded-br-md p-4`
                        }
                      >
                        {message.imageUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={message.imageUrl} 
                            alt="題目圖片" 
                            className="max-w-full h-auto max-h-48 rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.imageUrl, '_blank')}
                          />
                        )}
                        {message.content && (
                          <div>{message.content}</div>
                        )}
                      </div>
                    )}
                    
                  </div>
                ))}
                {/* 載入中狀態 */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border rounded-2xl rounded-bl-md shadow-sm p-4">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                        <span className="text-gray-600">AI 正在分析...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            {/* 輸入區域固定在底部 */}
            <div className="sticky bottom-0 bg-white border-t p-4 z-20">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleChatSubmit} className="flex space-x-3">
                  <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="繼續提問..."
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
                {/* 預設問題按鈕區塊 */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {['這題怎麼解？', '請幫我分析關鍵字', '請用不同方法解釋', '請列出詳細步驟', '請解釋為什麼這樣算'].map((preset, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setInput(preset)}
                      disabled={loading}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新增的 CropperPage 顯示 */}
      {showCropper && cropImage && (
        <CropperPage
          image={cropImage}
          onCancel={() => setShowCropper(false)}
          onCropComplete={(cropped) => {
            setShowCropper(false);
            setCropImage(null);
            setImagePreview(cropped);
            setPageState('question');
            setCurrentThreadId(null);
          }}
        />
      )}
    </div>
  );
}