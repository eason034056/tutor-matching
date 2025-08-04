import * as React from "react"
import { cn } from "@/lib/utils"

// 這是一個用來創建可滾動區域的組件
interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
}

// 使用 forwardRef 來讓父組件可以直接訪問這個DOM元素
const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, onScroll, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-auto", // 讓內容可以滾動
        className
      )}
      onScroll={onScroll}
      {...props}
    >
      {children}
    </div>
  )
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea } 