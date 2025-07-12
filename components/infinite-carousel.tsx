'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface InfiniteCarouselProps {
  images: string[]
  speed?: number
  imageWidth?: number
  imageHeight?: number
  className?: string
  gap?: number
}

export default function InfiniteCarousel({
  images,
  speed = 0.1,
  imageWidth = 200,
  imageHeight = 100,
  className = "",
  gap = 160
}: InfiniteCarouselProps) {
  const [position, setPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameId = useRef<number>()
  const lastTimeRef = useRef<number>()

  // 創建三組圖片來實現無縫循環
  const extendedImages = [...images, ...images, ...images]

  useEffect(() => {
    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime
      }

      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      setPosition((prevPosition) => {
        // 當滾動到第二組圖片的末尾時
        if (prevPosition <= -100) {
          // 立即跳回第一組圖片的對應位置
          return prevPosition + 100
        }
        return prevPosition - (speed * deltaTime * 0.01)
      })

      animationFrameId.current = requestAnimationFrame(animate)
    }

    animationFrameId.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [speed])

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
    >
      <div 
        className="flex"
        style={{ 
          height: `${imageHeight + 20}px`, // 圖片高度 + 20px 間距
          gap: `${gap}px`, // 動態間距
          transform: `translateX(${position}%)`,
          transition: position <= -100 ? 'none' : 'transform 0.1s linear',
          width: `${300}%`, // 三倍寬度，因為有三組圖片
        }}
      >
        {extendedImages.map((image, index) => (
          <div 
            key={`${image}-${index}`}
            className="flex-shrink-0 flex justify-center items-center"
            style={{ 
              width: `${100 / extendedImages.length}%`,
              padding: '0 20px',
              height: `${imageHeight}px` // 確保容器有正確高度
            }}
          >
            <Image
              src={image}
              alt={`Carousel image ${index + 1}`}
              width={imageWidth}
              height={imageHeight}
              className="object-contain"
              style={{
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                maxWidth: `${imageWidth}px`,
                maxHeight: `${imageHeight}px`
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
} 