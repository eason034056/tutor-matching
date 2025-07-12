'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { 
  Camera, 
  Upload, 
  Send, 
  ArrowLeft, 
  RefreshCw, 
  Plus,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  Menu,
  X,
  User,
  Home
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

// 定義請求資料類型
interface RequestData {
  message: string;
  userId: string;
  threadId?: string | null;
  questionImageUrl?: string;
  isNewThread?: boolean;
}

// 定義錯誤類型
interface ApiError extends Error {
  name: string;
  message: string;
}

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
  const [showThreadList, setShowThreadList] = useState(false);
  
  // 新增：聊天記錄載入狀態管理
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // 新增：超時處理相關狀態
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [apiTimeout, setApiTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRequest, setLastRequest] = useState<{
    type: 'question' | 'chat';
    data: RequestData;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 新增：超時控制的 ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 在 SolverPage 組件內部 state 加入：
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // 新增：清除超時計時器的函數
  const clearTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  };

  // 新增：設置超時計時器的函數
  const setTimeoutHandlers = () => {
    // 45秒後顯示警告
    warningTimeoutRef.current = setTimeout(() => {
      setTimeoutWarning(true);
    }, 45000);

    // 60秒後標記為超時
    timeoutRef.current = setTimeout(() => {
      setApiTimeout(true);
      setLoading(false);
      setTimeoutWarning(false);
    }, 60000);
  };

  // 新增：重試 API 請求的函數
  const retryRequest = async () => {
    if (!lastRequest || !user) return;

    setRetryCount(prev => prev + 1);
    setApiTimeout(false);
    setTimeoutWarning(false);

    if (lastRequest.type === 'question') {
      await handleQuestionSubmit(null, true);
    } else {
      await handleChatSubmit(null, true);
    }
  };

  // 新增：重置超時狀態的函數
  const resetTimeoutState = () => {
    clearTimeouts();
    setTimeoutWarning(false);
    setApiTimeout(false);
  };

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

  // 防止頁面滾動，但保持內部滾動
  useEffect(() => {
    document.body.classList.add('solver-no-scroll');
    
    return () => {
      document.body.classList.remove('solver-no-scroll');
    };
  }, []);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 載入特定 Thread 的訊息
  const loadThreadMessages = async (threadId: string) => {
    if (!user || loadingThreadId === threadId || isLoadingMessages) return;
    
    // 設置載入狀態
    setLoadingThreadId(threadId);
    setIsLoadingMessages(true);
    
    // 立即切換到聊天頁面並顯示載入狀態
    setPageState('chat');
    setCurrentThreadId(threadId);
    setMessages([]); // 清空當前消息以顯示載入狀態
    resetTimeoutState(); // 清理超時狀態
    
    // 手機自動收起側邊欄
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowThreadList(false);
    }
    
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
        
        // 添加小延遲以確保用戶看到載入狀態
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setMessages(convertedMessages);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 錯誤:', response.status, errorData);
        alert('載入聊天記錄失敗：' + (errorData.error || '未知錯誤'));
        // 錯誤時返回原來的狀態
        setPageState('home');
        setCurrentThreadId(null);
      }
    } catch (error) {
      console.error('Failed to load thread messages:', error);
      alert('載入聊天記錄失敗，請稍後再試');
      // 錯誤時返回原來的狀態
      setPageState('home');
      setCurrentThreadId(null);
    } finally {
      // 清除載入狀態
      setLoadingThreadId(null);
      setIsLoadingMessages(false);
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
  const handleQuestionSubmit = async (e?: React.FormEvent | null, isRetry: boolean = false) => {
    if (e) e.preventDefault();
    
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
    resetTimeoutState(); // 重置超時狀態
    setTimeoutHandlers(); // 設置新的超時計時器
    
    if (!isRetry) {
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

      // 保存請求資料以供重試使用
      setLastRequest({
        type: 'question',
        data: {
          message: currentQuestion,
          userId: user?.uid || '',
          questionImageUrl: imagePreview,
          isNewThread: true
        }
      });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 65000); // 65秒總超時

      const response = await fetch('/api/solver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lastRequest?.data || {
          message: currentQuestion,
          userId: user?.uid || '',
          questionImageUrl: imagePreview,
          isNewThread: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearTimeouts(); // 清除超時計時器

      if (response.ok) {
        const data = await response.json();
        const endTime = Date.now(); // 記錄結束時間
        console.log('[AI 回應時間] handleQuestionSubmit 花費秒數:', ((endTime - startTime) / 1000).toFixed(2), '秒');
        console.log('API 回傳:', data);
        if (data.error) {
          throw new Error('API 錯誤：' + data.error);
        }
        // 2. 等 AI 回覆後 append 到畫面
        const aiMessage: Message = {
          role: 'assistant',
          content: data.message
        };
        setMessages(prev => [...prev, aiMessage]);
        setCurrentThreadId(data.threadId);
        await loadThreads();
        setRetryCount(0); // 成功後重置重試次數
        setLastRequest(null); // 清除保存的請求
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      clearTimeouts();
      const apiError = error as ApiError;
      if (apiError.name === 'AbortError') {
        setApiTimeout(true);
      } else {
        alert('請求失敗：' + apiError.message);
      }
    } finally {
      setLoading(false);
      setTimeoutWarning(false);
    }
  };

  // 處理聊天輸入提交
  const handleChatSubmit = async (e?: React.FormEvent | null, isRetry: boolean = false) => {
    if (e) e.preventDefault();
    
    console.log('=== handleChatSubmit 開始 ===');
    console.log('input.trim():', input.trim());
    console.log('input.trim() 長度:', input.trim().length);
    console.log('loading:', loading);
    console.log('user:', user);
    console.log('!input.trim():', !input.trim());
    console.log('!input.trim() || loading || !user:', !input.trim() || loading || !user);
    
    if (!isRetry && (!input.trim() || loading || !user)) {
      console.log('條件檢查失敗，函式提前結束');
      return;
    }

    const startTime = Date.now(); // 記錄開始時間
    const message = isRetry ? (lastRequest?.data?.message || '') : input.trim();
    if (!isRetry) {
      setInput('');
      // 保存請求資料以供重試使用
      setLastRequest({
        type: 'chat',
        data: {
          message: message,
          userId: user?.uid || '',
          threadId: currentThreadId
        }
      });
    }
    
    setLoading(true);
    resetTimeoutState(); // 重置超時狀態
    setTimeoutHandlers(); // 設置新的超時計時器
    
    // 手機自動收起側邊欄（如果有切換 chat 狀態）
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowThreadList(false);
    }

    if (!isRetry) {
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
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 65000); // 65秒總超時

      const response = await fetch('/api/solver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lastRequest?.data || {
          message: message,
          userId: user?.uid || '',
          threadId: currentThreadId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearTimeouts(); // 清除超時計時器

      if (response.ok) {
        const data = await response.json();
        const endTime = Date.now(); // 記錄結束時間
        console.log('[AI 回應時間] handleChatSubmit 花費秒數:', ((endTime - startTime) / 1000).toFixed(2), '秒');
        console.log('API 回傳:', data);
        if (data.error) {
          throw new Error('API 錯誤：' + data.error);
        }
        // 2. 等 AI 回覆後 append 到畫面
        const aiMessage: Message = {
          role: 'assistant',
          content: data.message
        };
        setMessages(prev => [...prev, aiMessage]);
        await loadThreads();
        setRetryCount(0); // 成功後重置重試次數
        setLastRequest(null); // 清除保存的請求
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      clearTimeouts();
      const apiError = error as ApiError;
      if (apiError.name === 'AbortError') {
        setApiTimeout(true);
      } else {
        alert('請求失敗：' + apiError.message);
      }
    } finally {
      setLoading(false);
      setTimeoutWarning(false);
    }
  };

  // 回到首頁
  const goToHome = () => {
    setPageState('home');
    setImagePreview(null);
    setCurrentQuestion('');
    setMessages([]);
    setCurrentThreadId(null);
    resetTimeoutState();
  };

  // 回到提問頁
  const goToQuestion = () => {
    setPageState('question');
    resetTimeoutState();
  };

  // 開始新對話
  const startNewThread = () => {
    setPageState('home');
    setImagePreview(null);
    setCurrentQuestion('');
    setMessages([]);
    setCurrentThreadId(null);
    resetTimeoutState();
  };

  // 返回主頁面
  const goToMainPage = () => {
    window.location.href = '/';
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

  // 清理計時器
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, []);

  // 如果認證還在載入中，顯示載入狀態
  if (authLoading) {
    return (
      <div className="solver-container flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">檢查登入狀態...</p>
        </div>
      </div>
    );
  }

  // 如果沒有登入，顯示載入中（會自動重定向）
  if (!user) {
    return (
      <div className="solver-container flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">重定向到登入頁面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="solver-container flex overflow-hidden">
      {/* 手機版遮罩 */}
      {showThreadList && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setShowThreadList(false)}
        />
      )}
      
      {/* 側邊欄 */}
      <div
        className={`sidebar ${showThreadList ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static fixed top-0 left-0 h-full md:h-full w-80 z-50 
          bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
          flex flex-col`}
      >
        {/* 側邊欄 Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <Image 
                  src="/teacher-icon-192x192.png" 
                  alt="AI助手" 
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">解題助手</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={goToMainPage}
                className="text-gray-600 hover:text-green-600"
                title="返回主頁面"
              >
                <Home className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowThreadList(false)}
                className="md:hidden text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={startNewThread}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            新對話
          </Button>
        </div>

        {/* Thread 列表 */}
        <div className="threads-list scrollbar-hide">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">還沒有對話記錄</p>
            </div>
          ) : (
            <div className="px-2 py-1">
              {threads.map((thread) => {
                const isLoading = loadingThreadId === thread.id;
                const isCurrentThread = currentThreadId === thread.id;
                const isDisabled = isLoadingMessages && !isLoading;
                
                return (
                  <div
                    key={thread.id}
                    onClick={() => !isDisabled && loadThreadMessages(thread.id)}
                    className={`px-3 py-2 rounded-lg transition-all duration-200 mb-1 relative overflow-hidden ${
                      isCurrentThread
                        ? 'bg-green-50 border-l-4 border-green-500'
                        : isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-50 cursor-pointer'
                    } ${isLoading ? 'bg-green-100 shadow-sm' : ''}`}
                  >
                    {/* 載入覆蓋層 */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-white bg-opacity-80 rounded-lg flex items-center justify-center z-10">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />
                          <span className="text-xs text-green-600 font-medium">載入中...</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-2 w-full">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        thread.hasImage ? 'bg-green-100' : 'bg-gray-100'
                      } ${isLoading ? 'bg-green-200' : ''}`}>
                        {thread.hasImage ? (
                          <ImageIcon className={`w-4 h-4 transition-colors ${
                            isLoading ? 'text-green-700' : 'text-green-600'
                          }`} />
                        ) : (
                          <MessageSquare className={`w-4 h-4 transition-colors ${
                            isLoading ? 'text-gray-600' : 'text-gray-500'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className={`text-sm font-medium truncate transition-colors ${
                          isLoading ? 'text-green-800' : 'text-gray-900'
                        }`}>
                          {thread.title}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5 truncate">
                          <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{formatTime(thread.lastUpdated)}</span>
                        </div>
                      </div>
                      
                      {/* 載入指示器 - 改為flex佈局的一部分 */}
                      {isLoading && (
                        <div className="flex-shrink-0 ml-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 主內容區域 */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white h-full">
        {/* 手機版 Header */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setShowThreadList(!showThreadList)}
              className="mr-3"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">解題助手</h1>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={goToMainPage}
              className="text-gray-600 hover:text-green-600"
            >
              <Home className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 首頁 - 拍照/上傳選擇 */}
        {pageState === 'home' && (
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 h-full">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  <Image 
                    src="/teacher-icon-192x192.png" 
                    alt="AI助手" 
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">開始解題</h2>
                <p className="text-gray-600">上傳題目圖片，青椒老師幫你解答</p>
              </div>

              {/* 拍照/上傳按鈕 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Button 
                  onClick={handleCameraClick}
                  className="h-20 bg-green-500 hover:bg-green-600 text-white rounded-xl flex-col space-y-2"
                >
                  <Camera className="w-6 h-6" />
                  <span>拍照</span>
                </Button>
                <Button 
                  onClick={handleUploadClick}
                  className="h-20 bg-gray-500 hover:bg-gray-600 text-white rounded-xl flex-col space-y-2"
                >
                  <Upload className="w-6 h-6" />
                  <span>上傳</span>
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

              {/* 使用說明 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">使用說明</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 拍攝或上傳題目圖片</li>
                  <li>• 輸入你的問題</li>
                  <li>• 青椒老師會提供詳細解答</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 提問頁 - 圖片預覽 + 問題輸入 */}
        {pageState === 'question' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 h-full">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  onClick={goToHome}
                  className="mr-3"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900">輸入問題</h1>
              </div>
            </div>

            {/* 主要內容 */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* 圖片預覽 */}
                {imagePreview && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">題目圖片</h3>
                    </div>
                    <div className="p-4">
                      <Image 
                        src={imagePreview} 
                        alt="題目圖片" 
                        width={600}
                        height={400}
                        className="w-full h-auto max-h-96 object-contain rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => {
                          window.open(imagePreview, '_blank');
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 問題輸入 */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <form onSubmit={handleQuestionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        請輸入你的問題
                      </label>
                      <Textarea
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        placeholder="例如：這題怎麼解？請幫我分析關鍵字..."
                        className="min-h-[120px] resize-none border-gray-300 focus:border-green-500 focus:ring-green-500"
                        disabled={loading}
                      />
                    </div>

                    {/* 預設問題按鈕 */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                      {['這題怎麼解？', '請幫我分析關鍵字', '請用不同方法解釋', '請列出詳細步驟', '請解釋這個概念', '有其他解法嗎？'].map((preset, idx) => (
                        <Button
                          key={idx}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs whitespace-nowrap flex-shrink-0"
                          onClick={() => setCurrentQuestion(preset)}
                          disabled={loading}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      disabled={loading || !currentQuestion.trim()}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          分析中...
                          {timeoutWarning && (
                            <span className="text-green-200 ml-2">
                              (處理時間較長...)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          開始解題
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                {/* 超時錯誤顯示 */}
                {apiTimeout && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-3">
                          <h4 className="font-semibold text-orange-800 mb-2">處理時間過長</h4>
                          <p className="text-sm text-orange-700">
                            很抱歉，系統處理您的問題超過了預期時間。這可能是由於網路連線問題或題目較為複雜。
                          </p>
                        </div>
                        
                        {/* 重試按鈕 */}
                        <div className="flex items-center space-x-3">
                          <Button 
                            onClick={retryRequest}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                重試中...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                重試 {retryCount > 0 && `(第${retryCount + 1}次)`}
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            onClick={() => {
                              resetTimeoutState();
                              setLastRequest(null);
                              setRetryCount(0);
                            }}
                            variant="outline"
                            className="px-6 py-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                          >
                            取消
                          </Button>
                        </div>
                        
                        {/* 提示訊息 */}
                        <div className="mt-4 text-xs text-orange-600 bg-orange-50 p-3 rounded-lg">
                          <p className="font-medium mb-2">💡 小提示：</p>
                          <ul className="space-y-1 text-orange-600">
                            <li>• 複雜數學題目可能需要更長處理時間</li>
                            <li>• 確保網路連線穩定</li>
                            <li>• 如果問題持續，可以嘗試重新描述問題</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 聊天詳情頁 */}
        {pageState === 'chat' && (
          <div className="flex-1 flex flex-col bg-gray-50 chat-container">
            {/* Header - 固定在頂部 */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    onClick={goToQuestion}
                    className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </Button>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-green-100">
                      <Image 
                        src="/teacher-icon-192x192.png" 
                        alt="青椒老師" 
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">青椒老師</h1>
                      <p className="text-sm text-gray-500">AI 解題助手</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 聊天記錄區域 */}
            <div className="chat-messages px-6 py-4 scrollbar-hide">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* 骨架屏載入效果 */}
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="space-y-6">
                    {/* 骨架屏 - 用戶消息 */}
                    <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
                      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
                      <div className="flex justify-end">
                        <div className="max-w-md">
                          <div className="flex justify-end mb-1">
                            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                          <div className="bg-gray-200 rounded-2xl p-4 animate-pulse">
                            <div className="space-y-2">
                              <div className="h-20 w-48 bg-gray-300 rounded-lg"></div>
                              <div className="h-4 w-32 bg-gray-300 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 骨架屏 - AI 回覆 */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
                      <div className="max-w-3xl">
                        <div className="mb-2">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                          <div className="space-y-3">
                            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 載入指示器 */}
                    <div className="flex justify-center">
                      <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
                        <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                        <span className="text-sm text-green-600 font-medium">載入聊天記錄中...</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                      >
                        {/* 頭像 */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {message.role === 'user' ? (
                            <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <Image 
                              src="/teacher-icon-192x192.png" 
                              alt="青椒老師" 
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* 訊息內容 */}
                        <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                          {message.role === 'assistant' ? (
                            <div className="max-w-3xl">
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-900">青椒老師</span>
                                <span className="text-xs text-gray-500 ml-2">剛剛</span>
                              </div>
                              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                                <div className="prose max-w-none">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath, remarkGfm]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                      h1: ({...props}) => <h1 className="text-xl font-bold text-gray-900 mb-3" {...props} />,
                                      h2: ({...props}) => <h2 className="text-lg font-semibold text-gray-900 mb-2" {...props} />,
                                      h3: ({...props}) => <h3 className="text-md font-semibold text-gray-900 mb-2" {...props} />,
                                      p: ({...props}) => <p className="text-gray-700 mb-2 leading-relaxed" {...props} />,
                                      ul: ({...props}) => <ul className="list-disc list-inside text-gray-700 mb-2 space-y-1" {...props} />,
                                      ol: ({...props}) => <ol className="list-decimal list-inside text-gray-700 mb-2 space-y-1" {...props} />,
                                      code: ({inline, ...props}: React.JSX.IntrinsicElements['code'] & { inline?: boolean }) => 
                                        inline ? (
                                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800" {...props} />
                                        ) : (
                                          <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto" {...props} />
                                        ),
                                      blockquote: ({...props}) => <blockquote className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 text-gray-700 mb-2" {...props} />,
                                    }}
                                  >
                                    {fixLatexBlocks(message.content || "")}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="max-w-md">
                              <div className="flex justify-end mb-1">
                                <span className="text-xs text-gray-500">Me • 剛剛</span>
                              </div>
                              <div className="bg-green-500 text-white rounded-2xl p-4 shadow-sm">
                                {message.imageUrl && (
                                  <div className="mb-3">
                                    <Image 
                                      src={message.imageUrl} 
                                      alt="題目圖片" 
                                      width={300}
                                      height={200}
                                      className="max-w-full h-auto max-h-40 rounded-lg cursor-pointer"
                                      onClick={() => window.open(message.imageUrl, '_blank')}
                                      unoptimized
                                    />
                                  </div>
                                )}
                                {message.content && (
                                  <div className="text-white">{message.content}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {/* 載入中狀態 */}
                {loading && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <Image 
                        src="/teacher-icon-192x192.png" 
                        alt="青椒老師" 
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="max-w-3xl">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-900">青椒老師</span>
                        <span className="text-xs text-gray-500 ml-2">剛剛</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-green-500" />
                          <span className="text-gray-600">正在思考...</span>
                          {timeoutWarning && (
                            <span className="text-orange-500 text-sm ml-2">
                              (處理時間較長，請稍候...)
                            </span>
                          )}
                        </div>
                        {timeoutWarning && (
                          <div className="mt-2 text-xs text-orange-600">
                            💡 複雜題目可能需要更長時間處理
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 超時錯誤顯示 */}
                {apiTimeout && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <Image 
                        src="/teacher-icon-192x192.png" 
                        alt="青椒老師" 
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="max-w-3xl">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-900">青椒老師</span>
                        <span className="text-xs text-gray-500 ml-2">剛剛</span>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-2">
                              <h4 className="font-semibold text-orange-800 mb-1">處理時間過長</h4>
                              <p className="text-sm text-orange-700">
                                很抱歉，系統處理您的問題超過了預期時間。這可能是由於網路連線問題或題目較為複雜。
                              </p>
                            </div>
                            
                            {/* 重試按鈕 */}
                            <div className="flex items-center space-x-3">
                              <Button 
                                onClick={retryRequest}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    重試中...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    重試 {retryCount > 0 && `(${retryCount})`}
                                  </>
                                )}
                              </Button>
                              
                              <Button 
                                onClick={() => {
                                  resetTimeoutState();
                                  setLastRequest(null);
                                  setRetryCount(0);
                                }}
                                variant="outline"
                                className="text-sm px-4 py-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                              >
                                取消
                              </Button>
                            </div>
                            
                            {/* 提示訊息 */}
                            <div className="mt-3 text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">
                              <p className="font-medium mb-1">💡 小提示：</p>
                              <ul className="space-y-1 text-orange-600">
                                <li>• 複雜數學題目可能需要更長處理時間</li>
                                <li>• 確保網路連線穩定</li>
                                <li>• 如果問題持續，可以嘗試重新描述問題</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* 輸入區域 - 固定在底部 */}
            <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0 shadow-lg">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleChatSubmit} className="flex items-center space-x-3 bg-gray-50 rounded-full p-2">
                  
                  <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="輸入訊息..."
                    className="flex-1 border-0 bg-transparent focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:outline-none placeholder-gray-500 shadow-none"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10 p-0"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
                
                {/* 預設問題按鈕 */}
                <div className="mt-3">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {['這題怎麼解？', '請幫我分析關鍵字', '請用不同方法解釋', '請列出詳細步驟', '請解釋這個概念', '有其他解法嗎？'].map((preset, idx) => (
                      <Button
                        key={idx}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs bg-white hover:bg-gray-50 border-gray-200 rounded-full whitespace-nowrap flex-shrink-0"
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