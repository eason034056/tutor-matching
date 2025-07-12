'use client'
import { useEffect, useRef, useState } from 'react'

// 這個 Hook 用來檢測元素是否進入用戶的視窗範圍
// 當元素進入視窗時，就會觸發動畫
export function useScrollAnimation() {
  // 創建一個引用，用來指向 DOM 元素
  const elementRef = useRef<HTMLDivElement>(null)
  // 用來記錄元素是否已經進入視窗
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 獲取當前的 DOM 元素
    const element = elementRef.current
    if (!element) return

    // 創建一個觀察器，用來監聽元素是否進入視窗
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 當元素進入視窗時，設置為可見並停止觀察
        // 這樣動畫只會播放一次（向下滑動時）
        if (entry.isIntersecting) {
          setIsVisible(true)
          // 一旦元素變為可見，就停止觀察它
          // 這樣往回滑時不會重複播放動畫
          observer.unobserve(element)
        }
      },
      {
        // 設置觸發的閾值：當元素的 10% 進入視窗時就觸發
        threshold: 0.1,
        // 設置根邊距：在元素進入視窗前 50px 就開始觸發
        rootMargin: '0px 0px -50px 0px'
      }
    )

    // 開始觀察元素
    observer.observe(element)

    // 清理函數：當組件卸載時停止觀察
    return () => observer.disconnect()
  }, [])

  return { elementRef, isVisible }
}

// 動畫組件的屬性介面
interface ScrollAnimationWrapperProps {
  children: React.ReactNode
  className?: string
  delay?: number // 延遲時間（毫秒）
  duration?: number // 動畫持續時間（毫秒）
}

// 動畫組件：包裝其他元素並添加滾動動畫效果
export function ScrollAnimationWrapper({ 
  children, 
  className = '',
  delay = 150,
  duration = 1000
}: ScrollAnimationWrapperProps) {
  const { elementRef, isVisible } = useScrollAnimation()

  return (
    <div
      ref={elementRef}
      className={`${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{
        transitionProperty: 'all',
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isVisible ? 'translateY(0px)' : 'translateY(80px)'
      }}
    >
      {children}
    </div>
  )
} 