'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Send, ArrowLeft, ChevronDown, ChevronUp, RefreshCw, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import type { Message } from '@/lib/types';

// 定義狀態類型
type PageState = 'home' | 'question' | 'chat';

interface SolverChatProps {
  messages: Message[];
  onSendMessage: (message: string, imageUrl?: string) => Promise<void>;
  loading: boolean;
}

export default function SolverChat({ messages, onSendMessage, loading }: SolverChatProps) {
  const [pageState, setPageState] = useState<PageState>('home');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set());
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動滾動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 處理圖片上傳
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      setPageState('question');
    };
    reader.readAsDataURL(file);
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
      handleImageUpload(file);
    }
  };

  // 處理問題提交
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion.trim() || !imagePreview || loading) return;

    setPageState('chat');

    try {
      await onSendMessage(currentQuestion, imagePreview);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 處理聊天輸入提交
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    
    try {
      await onSendMessage(message);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 切換答案展開/收合
  const toggleAnswerExpansion = (index: number) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedAnswers(newExpanded);
  };

  // 回到首頁
  const goToHome = () => {
    setPageState('home');
    setImagePreview(null);
    setCurrentQuestion('');
  };

  // 回到提問頁
  const goToQuestion = () => {
    setPageState('question');
  };

  // 首頁 - 拍照/上傳選擇
  if (pageState === 'home') {
    return (
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
            onChange={handleFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
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
    );
  }

  // 提問頁 - 圖片預覽 + 問題輸入
  if (pageState === 'question') {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3">
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
    );
  }

  // 聊天詳情頁
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
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
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                    : 'bg-white border rounded-2xl rounded-bl-md shadow-sm'
                } p-4`}
              >
                {message.imageUrl && (
                  <img 
                    src={message.imageUrl} 
                    alt="題目圖片" 
                    className="max-w-full h-auto max-h-48 rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.imageUrl, '_blank')}
                  />
                )}
                
                {message.content && (
                  <div className={message.role === 'assistant' ? 'text-gray-900' : ''}>
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div>{message.content}</div>
                    )}
                  </div>
                )}

                {/* AI 回答的快捷操作 */}
                {message.role === 'assistant' && message.content && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs text-gray-600 hover:text-gray-900"
                      onClick={() => toggleAnswerExpansion(index)}
                    >
                      {expandedAnswers.has(index) ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          收合
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          展開
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      重新解釋
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      <BarChart3 className="w-3 h-3 mr-1" />
                      比較差異
                    </Button>
                  </div>
                )}
              </div>
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
      <div className="bg-white border-t p-4">
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
  );
} 