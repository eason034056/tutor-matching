# 解題聊天機器人 - 新版本

## 概述

根據 `解題聊天機器人_wireframe_開發文件.md` 的規格，我們已經完全重寫了 solver 頁面，實現了 Thread 功能和新的 UI 設計。

## 主要功能

### 1. Thread 管理系統
- **Thread 列表**：側邊欄顯示所有對話記錄
- **Thread 創建**：上傳新圖片時自動創建新 Thread
- **Thread 切換**：點擊 Thread 可以切換到不同的對話
- **Thread 標題**：自動從第一條訊息生成標題
- **圖片標記**：有圖片的 Thread 會顯示圖示

### 2. 三頁式設計流程

#### 首頁 (Home Page)
- 拍照/上傳按鈕
- 使用範例說明
- 響應式設計

#### 提問頁 (Question Page)
- 圖片預覽（可點擊放大）
- 問題輸入框
- 預設問題按鈕
- 返回導航

#### 聊天詳情頁 (Chat Page)
- 現代化聊天界面
- 支援圖片顯示
- Markdown 和數學公式渲染
- 快捷操作按鈕

### 3. 資料庫結構

#### chat_threads 集合
```typescript
interface ChatThread {
  id: string;
  userId: string;
  title: string;
  hasImage: boolean;
  createdAt: number;
  lastUpdated: number;
}
```

#### chat_messages 集合
```typescript
interface ChatMessage {
  id: string;
  threadId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: number;
}
```

## API 端點

### 1. 主要解題 API
```
POST /api/solver
Body: {
  message: string;
  userId: string;
  questionImageUrl?: string;
  threadId?: string;
  isNewThread?: boolean;
}
```

### 2. Thread 列表 API
```
GET /api/solver/threads?userId={userId}
Response: { threads: ChatThread[] }
```

### 3. Thread 訊息 API
```
GET /api/solver/threads/{threadId}/messages?userId={userId}
Response: { messages: ChatMessage[] }
```

## 技術實現

### 前端技術
- **React 18** + **Next.js 14** (App Router)
- **TypeScript** 類型安全
- **Tailwind CSS** 響應式設計
- **Shadcn/ui** 組件庫
- **Lucide React** 圖標系統

### 後端技術
- **Next.js API Routes**
- **Firebase Firestore** 資料庫
- **Firebase Authentication** 認證

### 特殊功能
- **React Markdown** 支援 Markdown 渲染
- **KaTeX** 數學公式渲染
- **圖片上傳和預覽**
- **自動滾動到最新訊息**

## 使用流程

1. **登入系統**：用戶需要先登入才能使用
2. **選擇操作**：拍照或上傳圖片
3. **輸入問題**：在提問頁輸入具體問題
4. **獲得解答**：AI 分析並提供步驟式解題
5. **繼續對話**：可以追問或要求重新解釋
6. **管理 Thread**：在側邊欄切換不同的對話

## 設計規範

### 色彩系統
- **主色調**: `#3B82F6` (藍色)
- **輔助色**: `#06B6D4` (青色)
- **背景色**: `#F9FAFB` (淺灰)
- **表面色**: `#FFFFFF` (白色)

### 響應式設計
- **桌面版**: 側邊欄 + 主內容區域
- **手機版**: 可收合的側邊欄
- **平板版**: 自適應佈局

## 文件結構

```
app/solver/
├── page.tsx                    # 主頁面組件
├── auth/                       # 認證相關頁面
│   ├── login/page.tsx
│   └── register/page.tsx
└── ...

app/api/solver/
├── route.ts                    # 主要解題 API
└── threads/
    ├── route.ts                # Thread 列表 API
    └── [threadId]/
        └── messages/
            └── route.ts        # Thread 訊息 API

lib/
├── types.ts                    # 類型定義
└── firebase/
    ├── config.ts               # Firebase 客戶端配置
    └── firebase-admin.ts       # Firebase Admin 配置

hooks/
└── useAuth.ts                  # 認證 Hook
```

## 開發說明

### 環境變數
確保以下環境變數已設置：
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
NEXT_PUBLIC_FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
```

### 運行項目
```bash
npm run dev
```

### 訪問頁面
- 主頁面：`http://localhost:3000/solver`
- 登入頁面：`http://localhost:3000/solver/auth/login`
- 註冊頁面：`http://localhost:3000/solver/auth/register`

## 未來改進

1. **AI 整合**：整合真實的 AI 解題服務
2. **圖片 OCR**：添加文字識別功能
3. **語音輸入**：支援語音提問
4. **分享功能**：解題結果分享
5. **收藏功能**：重要解答收藏
6. **Thread 刪除**：支援刪除不需要的 Thread
7. **Thread 編輯**：支援編輯 Thread 標題

## 注意事項

- 目前 AI 回應是模擬的，需要整合真實的 AI 服務
- 圖片上傳功能需要配置 Cloudinary 或其他圖片服務
- 建議添加錯誤處理和載入狀態
- 可以考慮添加離線支援功能

---

**版本**: v2.0  
**更新日期**: 2025-01-28  
**開發者**: AI Assistant 