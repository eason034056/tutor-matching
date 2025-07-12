# 青椒老師家教中心 - 主題色系統使用指南

## 🎨 設計理念

我們的主題色系統基於**自然、專業、溫暖、可信賴**的設計理念，以您提供的兩個主色為基礎：

- **主要品牌色**: `#427A5B` (深綠色) - 代表專業與穩重
- **輔助品牌色**: `#B4CD93` (淺綠色) - 代表溫暖與親和

## 🎯 色彩系統結構

### 1. 主要品牌色 (`brand-*`)
```css
brand-50:  #f0f7ed  /* 最淺 - 背景色 */
brand-100: #d8ebc8  /* 淺色 - 懸停背景 */
brand-200: #B4CD93  /* 您的輔助色 */
brand-300: #9bbf7a  /* 中淺 */
brand-400: #82b061  /* 中色 */
brand-500: #427A5B  /* 您的主色 */
brand-600: #3a6b50  /* 深色 */
brand-700: #2d5240  /* 更深 */
brand-800: #1f3a2d  /* 最深 */
brand-900: #142419  /* 極深 */
```

### 2. 中性色 (`neutral-*`)
```css
neutral-50:  #f8fafc  /* 背景色 */
neutral-100: #f1f5f9  /* 淺背景 */
neutral-200: #e2e8f0  /* 邊框色 */
neutral-300: #cbd5e1  /* 分隔線 */
neutral-400: #94a3b8  /* 輔助文字 */
neutral-500: #64748b  /* 一般文字 */
neutral-600: #475569  /* 深度文字 */
neutral-700: #334155  /* 標題文字 */
neutral-800: #1e293b  /* 主要文字 */
neutral-900: #0f172a  /* 最深文字 */
```

## 🛠️ 使用方法

### 在 React 組件中使用

```tsx
// 使用 Tailwind 類別
<button className="bg-brand-500 text-white hover:bg-brand-600">
  主要按鈕
</button>

<button className="bg-brand-200 text-brand-800 hover:bg-brand-300">
  次要按鈕
</button>

<p className="text-neutral-600">
  一般文字內容
</p>

<h1 className="text-neutral-900">
  標題文字
</h1>
```

### 在 TypeScript 中使用

```tsx
import { colors } from '@/lib/theme'

// 直接使用顏色值
const primaryColor = colors.primary[500] // #427A5B
const lightBg = colors.primary[50]       // #f0f7ed

// 使用組合色彩
const buttonStyle = {
  backgroundColor: colors.combinations.buttonPrimary.bg,
  color: colors.combinations.buttonPrimary.text,
}
```

## 🎨 常用色彩組合

### 按鈕設計
```tsx
// 主要按鈕 (行動呼籲)
<button className="bg-brand-500 text-white hover:bg-brand-600 transition-colors">
  立即行動
</button>

// 次要按鈕
<button className="bg-brand-200 text-brand-800 hover:bg-brand-300 transition-colors">
  次要動作
</button>

// 文字按鈕
<button className="text-brand-700 hover:bg-brand-50 transition-colors">
  文字連結
</button>
```

### 卡片設計
```tsx
<div className="bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-neutral-900 font-semibold">卡片標題</h3>
  <p className="text-neutral-600">卡片內容描述</p>
</div>
```

### 表單設計
```tsx
<div className="space-y-4">
  <label className="text-neutral-700 font-medium">
    標籤文字
  </label>
  <input className="border border-neutral-200 focus:border-brand-500 focus:ring-brand-500" />
</div>
```

## 📱 響應式設計

### 不同狀態的顏色
```tsx
// 懸停狀態
hover:bg-brand-100
hover:text-brand-700

// 焦點狀態
focus:border-brand-500
focus:ring-brand-500

// 活動狀態
active:bg-brand-700
```

## 🚀 最佳實踐

### 1. 色彩層次
- **深色文字** (`neutral-800`, `neutral-900`) - 用於標題和重要內容
- **中色文字** (`neutral-600`, `neutral-700`) - 用於一般內容
- **淺色文字** (`neutral-400`, `neutral-500`) - 用於輔助資訊

### 2. 背景色使用
- **主背景** - `bg-white`
- **次要背景** - `bg-neutral-50`
- **強調背景** - `bg-brand-50`

### 3. 邊框和分隔線
- **一般邊框** - `border-neutral-200`
- **強調邊框** - `border-brand-300`
- **分隔線** - `border-neutral-100`

### 4. 陰影效果
```tsx
// 輕微陰影
shadow-sm

// 一般陰影
shadow-md

// 強調陰影
shadow-lg hover:shadow-xl
```

## 🎯 語義化使用

### 功能色彩
```tsx
// 成功狀態
text-green-600 bg-green-50

// 警告狀態
text-yellow-600 bg-yellow-50

// 錯誤狀態
text-red-600 bg-red-50

// 資訊狀態
text-blue-600 bg-blue-50
```

### 品牌相關
```tsx
// 品牌強調
text-brand-600 bg-brand-50

// 品牌導航
text-brand-700 hover:text-brand-800
```

## 🔧 開發工具

### 顏色工具函數
```typescript
import { getColor } from '@/lib/theme'

// 取得特定顏色
const primaryColor = getColor('primary.500')
const lightBg = getColor('primary.50')
```

### CSS 變數
```css
:root {
  --color-primary: #427A5B;
  --color-primary-light: #B4CD93;
  --color-text-primary: #1e293b;
  --color-background: #ffffff;
}
```

## 📋 檢查清單

在使用新的色彩系統時，請確保：

- [ ] 使用 `brand-*` 系列用於品牌相關元素
- [ ] 使用 `neutral-*` 系列用於文字和背景
- [ ] 確保色彩對比度符合無障礙標準
- [ ] 在不同狀態下測試顏色效果
- [ ] 保持整體視覺一致性

## 🎨 設計原則

1. **一致性** - 在整個應用中保持色彩使用的一致性
2. **層次性** - 使用不同深度的顏色來建立視覺層次
3. **功能性** - 色彩應該有明確的功能和語義
4. **可讀性** - 確保文字與背景有足夠的對比度
5. **品牌性** - 適當使用品牌色來強化品牌識別

---

## 📞 需要協助？

如果您在使用主題色系統時遇到任何問題，請參考：

1. `lib/theme.ts` - 完整的色彩定義
2. `tailwind.config.js` - Tailwind 配置
3. 已更新的組件文件作為範例

記住：**一致性是關鍵**！🎯 