'use client'

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { RefreshCw } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import CropperPage from '@/components/CropperPage'
import SolverQuickStart from '@/components/solver/SolverQuickStart'
import SolverQuestionStep from '@/components/solver/SolverQuestionStep'
import SolverChatView from '@/components/solver/SolverChatView'
import SolverThreadDrawer, { SolverThreadRail } from '@/components/solver/SolverThreadDrawer'
import { getChatPresets, getQuestionPresets } from '@/components/solver/solverPresets'
import type {
  MessageWithMeta,
  RetryRequest,
  SolverPageState,
  SolverRequestData,
  SubjectType,
  ThreadMessagesApiResponse,
  ThreadsApiResponse,
} from '@/components/solver/types'
import type { ChatThread } from '@/lib/types'
import styles from '@/components/solver/solver.module.css'

const API_ABORT_TIMEOUT_MS = 65000
const WARNING_TIMEOUT_MS = 45000
const RESPONSE_TIMEOUT_MS = 60000

export default function SolverShell() {
  const { user, loading: authLoading } = useAuth()

  const [pageState, setPageState] = useState<SolverPageState>('home')
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [subjectType, setSubjectType] = useState<SubjectType | null>(null)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<MessageWithMeta[]>([])

  const [threads, setThreads] = useState<ChatThread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [showThreadDrawer, setShowThreadDrawer] = useState(false)

  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const [requestStartTime, setRequestStartTime] = useState<number | null>(null)
  const [currentWaitTime, setCurrentWaitTime] = useState<number>(0)

  const [cropImage, setCropImage] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)

  const [timeoutWarning, setTimeoutWarning] = useState(false)
  const [apiTimeout, setApiTimeout] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastRequest, setLastRequest] = useState<RetryRequest | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (loading && requestStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - requestStartTime) / 1000)
        setCurrentWaitTime(elapsed)
      }, 1000)
    } else {
      setCurrentWaitTime(0)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [loading, requestStartTime])

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = null
    }
  }, [])

  const setTimeoutHandlers = useCallback(() => {
    warningTimeoutRef.current = setTimeout(() => {
      setTimeoutWarning(true)
    }, WARNING_TIMEOUT_MS)

    timeoutRef.current = setTimeout(() => {
      setApiTimeout(true)
      setLoading(false)
      setTimeoutWarning(false)
    }, RESPONSE_TIMEOUT_MS)
  }, [])

  const resetTimeoutState = useCallback(() => {
    clearTimeouts()
    setTimeoutWarning(false)
    setApiTimeout(false)
  }, [clearTimeouts])

  useEffect(() => {
    return () => {
      clearTimeouts()
    }
  }, [clearTimeouts])

  const loadThreads = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/solver/threads?userId=${user.uid}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert('載入對話列表失敗：' + (errorData.error || '未知錯誤'))
        return
      }

      const data = (await response.json()) as ThreadsApiResponse
      setThreads(data.threads || [])
    } catch (error) {
      console.error('Failed to load threads:', error)
      alert('載入對話列表失敗，請稍後再試')
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      window.location.href = '/solver/auth/login'
      return
    }

    loadThreads()
  }, [authLoading, user, loadThreads])

  const loadThreadMessages = useCallback(
    async (threadId: string) => {
      if (!user || loadingThreadId === threadId || isLoadingMessages) return

      setLoadingThreadId(threadId)
      setIsLoadingMessages(true)
      setPageState('chat')
      setCurrentThreadId(threadId)
      setMessages([])
      setShowThreadDrawer(false)
      resetTimeoutState()

      try {
        const response = await fetch(`/api/solver/threads/${threadId}/messages?userId=${user.uid}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          alert('載入聊天記錄失敗：' + (errorData.error || '未知錯誤'))
          setPageState('home')
          setCurrentThreadId(null)
          return
        }

        const data = (await response.json()) as ThreadMessagesApiResponse
        const convertedMessages: MessageWithMeta[] = (data.messages || []).map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
          imageUrl: msg.imageUrl,
        }))

        await new Promise((resolve) => setTimeout(resolve, 220))
        setMessages(convertedMessages)
      } catch (error) {
        console.error('Failed to load thread messages:', error)
        alert('載入聊天記錄失敗，請稍後再試')
        setPageState('home')
        setCurrentThreadId(null)
      } finally {
        setLoadingThreadId(null)
        setIsLoadingMessages(false)
      }
    },
    [isLoadingMessages, loadingThreadId, resetTimeoutState, user]
  )

  const handleSubjectCameraClick = (type: SubjectType) => {
    setSubjectType(type)
    cameraInputRef.current?.click()
  }

  const handleSubjectUploadClick = (type: SubjectType) => {
    setSubjectType(type)
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const originalDataUrl = ev.target?.result as string
      setCropImage(originalDataUrl)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)

    event.target.value = ''
  }

  const runSolverRequest = useCallback(
    async (
      payload: SolverRequestData,
      userMessage: MessageWithMeta,
      onSuccess: (responseData: { message: string; threadId: string }, requestStartedAt: number) => Promise<void>
    ) => {
      setLoading(true)
      resetTimeoutState()
      setTimeoutHandlers()
      setApiTimeout(false)
      setShowThreadDrawer(false)

      const startTime = Date.now()
      setRequestStartTime(startTime)
      setMessages((prev) => [...prev, userMessage])

      const controller = new AbortController()
      const abortTimer = setTimeout(() => controller.abort(), API_ABORT_TIMEOUT_MS)

      try {
        const response = await fetch('/api/solver', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = (await response.json()) as { message?: string; threadId?: string; error?: string }

        if (data.error) {
          throw new Error('API 錯誤：' + data.error)
        }

        if (!data.message || !data.threadId) {
          throw new Error('API 回應格式錯誤')
        }

        clearTimeouts()
        setApiTimeout(false)
        setTimeoutWarning(false)
        setRetryCount(0)
        setLastRequest(null)
        await onSuccess({ message: data.message, threadId: data.threadId }, startTime)
      } catch (error: unknown) {
        clearTimeouts()

        if (error instanceof Error && error.name === 'AbortError') {
          setApiTimeout(true)
          return
        }

        alert('請求失敗：' + (error as Error).message)
      } finally {
        clearTimeout(abortTimer)
        setLoading(false)
        setTimeoutWarning(false)
        setRequestStartTime(null)
      }
    },
    [clearTimeouts, resetTimeoutState, setTimeoutHandlers]
  )

  const submitQuestion = useCallback(
    async ({
      question,
      preview,
      subject,
      shouldStoreRetry,
    }: {
      question: string
      preview: string
      subject: SubjectType
      shouldStoreRetry: boolean
    }) => {
      if (!user || loading) return
      if (!question.trim() || !preview) return

      const normalizedQuestion = question.trim()
      const payload: SolverRequestData = {
        message: normalizedQuestion,
        userId: user.uid,
        questionImageUrl: preview,
        isNewThread: true,
        subjectType: subject,
      }

      if (shouldStoreRetry) {
        setLastRequest({ type: 'question', data: payload })
      }

      setPageState('chat')

      await runSolverRequest(
        payload,
        {
          role: 'user',
          content: normalizedQuestion,
          imageUrl: preview,
          timestamp: Date.now(),
        },
        async ({ message, threadId }, requestStartedAt) => {
          const endTime = Date.now()
          const responseTime = Math.round((endTime - requestStartedAt) / 1000)

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: message,
              timestamp: endTime,
              responseTime,
            },
          ])
          setCurrentThreadId(threadId)
          await loadThreads()
        }
      )
    },
    [loadThreads, loading, runSolverRequest, user]
  )

  const submitChat = useCallback(
    async ({
      message,
      subject,
      threadId,
      shouldStoreRetry,
    }: {
      message: string
      subject: SubjectType | null
      threadId: string | null
      shouldStoreRetry: boolean
    }) => {
      if (!user || loading) return
      if (!message.trim()) return

      const normalizedMessage = message.trim()
      const payload: SolverRequestData = {
        message: normalizedMessage,
        userId: user.uid,
        threadId,
        subjectType: subject,
      }

      if (shouldStoreRetry) {
        setLastRequest({ type: 'chat', data: payload })
      }

      setInput('')

      await runSolverRequest(
        payload,
        {
          role: 'user',
          content: normalizedMessage,
          timestamp: Date.now(),
        },
        async ({ message: aiMessage }, requestStartedAt) => {
          const endTime = Date.now()
          const responseTime = Math.round((endTime - requestStartedAt) / 1000)

          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: aiMessage,
              timestamp: endTime,
              responseTime,
            },
          ])
          await loadThreads()
        }
      )
    },
    [loadThreads, loading, runSolverRequest, user]
  )

  const handleQuestionSubmit = async (event?: FormEvent | null) => {
    if (event) {
      event.preventDefault()
    }

    if (!subjectType || !imagePreview) return

    await submitQuestion({
      question: currentQuestion,
      preview: imagePreview,
      subject: subjectType,
      shouldStoreRetry: true,
    })
  }

  const handleChatSubmit = async (event?: FormEvent | null) => {
    if (event) {
      event.preventDefault()
    }

    await submitChat({
      message: input,
      subject: subjectType,
      threadId: currentThreadId,
      shouldStoreRetry: true,
    })
  }

  const retryRequest = async () => {
    if (!lastRequest || !user || loading) return

    setRetryCount((prev) => prev + 1)
    resetTimeoutState()

    if (lastRequest.type === 'question') {
      const retrySubject = lastRequest.data.subjectType || subjectType
      const retryPreview = lastRequest.data.questionImageUrl || imagePreview

      if (!retrySubject || !retryPreview) return

      setSubjectType(retrySubject)
      setImagePreview(retryPreview)
      setCurrentQuestion(lastRequest.data.message)

      await submitQuestion({
        question: lastRequest.data.message,
        preview: retryPreview,
        subject: retrySubject,
        shouldStoreRetry: false,
      })

      return
    }

    const retrySubject = lastRequest.data.subjectType || subjectType
    setSubjectType(retrySubject)
    setInput(lastRequest.data.message)

    await submitChat({
      message: lastRequest.data.message,
      subject: retrySubject,
      threadId: lastRequest.data.threadId || currentThreadId,
      shouldStoreRetry: false,
    })
  }

  const goToHome = () => {
    setPageState('home')
    setImagePreview(null)
    setCurrentQuestion('')
    setMessages([])
    setCurrentThreadId(null)
    setSubjectType(null)
    setInput('')
    resetTimeoutState()
  }

  const goToQuestion = () => {
    setPageState('question')
    resetTimeoutState()
  }

  const startNewThread = () => {
    goToHome()
  }

  const goToMainPage = () => {
    window.location.href = '/'
  }

  const clearTimeoutError = () => {
    resetTimeoutState()
    setLastRequest(null)
    setRetryCount(0)
  }

  const formatTime = (timestamp: number | Date) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    }

    return date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })
  }

  if (authLoading) {
    return (
      <div className={`${styles.root} flex items-center justify-center`}>
        <div className="rounded-3xl border border-brand-100 bg-white/90 px-8 py-10 text-center shadow-[0_24px_50px_rgba(66,122,91,0.12)]">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium text-neutral-600">檢查登入狀態...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`${styles.root} flex items-center justify-center`}>
        <div className="rounded-3xl border border-brand-100 bg-white/90 px-8 py-10 text-center shadow-[0_24px_50px_rgba(66,122,91,0.12)]">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium text-neutral-600">重定向到登入頁面...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root} data-solver-mobile-first>
      <div className={styles.ambientLayer}>
        <div className={styles.orbA} />
        <div className={styles.orbB} />
        <div className={styles.grain} />
      </div>

      <SolverThreadDrawer
        open={showThreadDrawer}
        threads={threads}
        currentThreadId={currentThreadId}
        loadingThreadId={loadingThreadId}
        isLoadingMessages={isLoadingMessages}
        onLoadThread={loadThreadMessages}
        onStartNewThread={startNewThread}
        onGoMainPage={goToMainPage}
        onClose={() => setShowThreadDrawer(false)}
        formatTime={formatTime}
      />

      <div className={styles.shell}>
        <aside className="hidden h-full w-[320px] shrink-0 md:block lg:w-[340px]">
          <SolverThreadRail
            threads={threads}
            currentThreadId={currentThreadId}
            loadingThreadId={loadingThreadId}
            isLoadingMessages={isLoadingMessages}
            onLoadThread={loadThreadMessages}
            onStartNewThread={startNewThread}
            onGoMainPage={goToMainPage}
            onClose={() => undefined}
            formatTime={formatTime}
          />
        </aside>

        <main className={`min-w-0 flex-1 ${styles.mainPanel}`} data-solver-desktop-two-column>
          {pageState === 'home' ? (
            <SolverQuickStart
              threadsCount={threads.length}
              onOpenThreads={() => setShowThreadDrawer(true)}
              onGoMainPage={goToMainPage}
              onCameraPick={handleSubjectCameraClick}
              onUploadPick={handleSubjectUploadClick}
            />
          ) : null}

          {pageState === 'question' ? (
            <SolverQuestionStep
              subjectType={subjectType}
              imagePreview={imagePreview}
              currentQuestion={currentQuestion}
              loading={loading}
              timeoutWarning={timeoutWarning}
              apiTimeout={apiTimeout}
              retryCount={retryCount}
              presets={getQuestionPresets(subjectType)}
              onQuestionChange={setCurrentQuestion}
              onPresetSelect={setCurrentQuestion}
              onSubmit={handleQuestionSubmit}
              onBack={goToHome}
              onRetry={retryRequest}
              onClearTimeout={clearTimeoutError}
              onOpenThreads={() => setShowThreadDrawer(true)}
              onGoMainPage={goToMainPage}
            />
          ) : null}

          {pageState === 'chat' ? (
            <SolverChatView
              subjectType={subjectType}
              messages={messages}
              input={input}
              loading={loading}
              isLoadingMessages={isLoadingMessages}
              currentWaitTime={currentWaitTime}
              timeoutWarning={timeoutWarning}
              apiTimeout={apiTimeout}
              retryCount={retryCount}
              presets={getChatPresets(subjectType)}
              onInputChange={setInput}
              onPresetSelect={setInput}
              onSubmit={handleChatSubmit}
              onBack={goToQuestion}
              onRetry={retryRequest}
              onClearTimeout={clearTimeoutError}
              onOpenThreads={() => setShowThreadDrawer(true)}
              onGoMainPage={goToMainPage}
            />
          ) : null}
        </main>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-label="上傳題目圖片"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        aria-label="拍照上傳題目圖片"
      />

      {showCropper && cropImage ? (
        <CropperPage
          image={cropImage}
          onCancel={() => setShowCropper(false)}
          onCropComplete={(cropped) => {
            setShowCropper(false)
            setCropImage(null)
            setImagePreview(cropped)
            setPageState('question')
            setCurrentThreadId(null)
          }}
        />
      ) : null}
    </div>
  )
}
