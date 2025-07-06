# 解題聊天機器人

**Wireframe 及完整開發文件**\
(版本 v2.0 ‧ 2025‑06‑28)

---

## 目錄

1. 產品定位與核心流程
2. 使用者流程圖
3. Wireframe（低保真）
4. UI 元件規格表
5. 系統架構與技術選型
6. API 介面設計
7. 資料結構與狀態管理
8. Thread 功能設計
9. 設計規範（Design Tokens）

---

## 1. 產品定位與核心流程

- **定位**：一款「圖片先行」的數學/理科解題聊天機器人，支援拍照或上傳題目圖片，利用 OCR＋LLM 解析並產生步驟式解題。
- **目標族群**：國高中生、自學者；需即時獲得題目解析的人。
- **核心流程**：
  1. 使用者拍照/上傳題目 →
  2. 系統 OCR 文字擷取 →
  3. 使用者輸入具體提問 →
  4. LLM 產生解析 →
  5. 可追問、收藏、分享。
- **Thread 功能**：以一題一題為一個 thread，模型會記憶當個 thread 的聊天記錄以便接續回答。

---

## 2. 使用者流程圖（ASCII）

```
┌──────────┐          ┌────────────┐
│  開啟 App │ ─────→ │  首次指引   │
└──────────┘          └──────┬─────┘
                             ↓
                  ┌────────────────────┐
                  │  選擇 Thread 或    │
                  │  開始新對話        │
                  └──────┬─────────────┘
                         ↓
                  ┌────────────────────┐
                  │  拍照 / 上傳 圖片   │
                  └──────┬─────────────┘
                         ↓
                ┌───────────────────────┐
                │   輸入問題文字        │
                └──────┬──────────────┘
                       ↓
              ┌─────────────────────────┐
              │   等待 AI 解析          │
              └──────┬─────────────────┘
                     ↓
            ┌───────────────────────────┐
            │   顯示解題卡片 + 快捷操作 │
            └──────┬─────────────────┘
                   ↓
            ┌───────────────────────────┐
            │   繼續追問或開始新 Thread │
            └───────────────────────────┘
```

---

## 3. Wireframe（低保真）

### 3.1 主頁面（Thread 列表 + 聊天區域）

```
+─────────────────────────────────────────────────────────────────+
| LOGO   解題助手                                    [新對話]      |   ← Header
+─────────────────────────────────────────────────────────────────+
| Thread 列表                    | 聊天區域                        |
| ───────────────────────────── | ─────────────────────────────── |
| 📝 這題怎麼解？                |                                |
| 2025-01-28 14:30              |  [ 📷 拍照 ]  [ 🖼️ 上傳 ]      |
| ───────────────────────────── |                                |
| 📷 請幫我分析關鍵字            |  ─────────────────────────────  |
| 2025-01-28 13:15              |  使用範例                       |
| ───────────────────────────── |  ▸ 拍下題目圖片 → 輸入「這題怎麼解？」 |
| 📝 請用不同方法解釋            |  ▸ 選擇相簿圖片 → 輸入「請幫我找關鍵字」 |
| 2025-01-28 12:00              |                                |
+─────────────────────────────────────────────────────────────────+
```

### 3.2 提問頁（圖片＋輸入）

```
+─────────────────────────────────────────────────────────────────+
| < 上一步                                    | 解題對話          |
+─────────────────────────────────────────────────────────────────+
|  圖片縮圖 (可點擊放大)                      |                   |
|────────────────────────────────────────────|                   |
|  📝 請輸入你對這張圖片的問題…               |                   |
|                                            |                   |
|  [ 送出 ]                                   |                   |
+─────────────────────────────────────────────────────────────────+
```

### 3.3 聊天詳情頁（結果卡片）

```
+─────────────────────────────────────────────────────────────────+
| AI 正在分析…  (spinner)                    | Thread 列表        |
|────────────────────────────────────────────| ───────────────── |
| ✅ 解題步驟如下                            | 📝 這題怎麼解？    |
|  1. 依題意得 x + y = 35                    | 2025-01-28 14:30  |
|  2. 2x = 3y                                | ───────────────── |
|  3. …                                      | 📷 請幫我分析關鍵字|
| [ 展開／收合 ]                             | 2025-01-28 13:15  |
|────────────────────────────────────────────| ───────────────── |
| 🔄 我還是不懂  |  🆚 比較選項差異            | 📝 請用不同方法解釋|
+─────────────────────────────────────────────────────────────────+
|  ↑ 回到輸入框                              | 2025-01-28 12:00  |
+─────────────────────────────────────────────────────────────────+
```

> **註**：Wireframe 為示意，最終視覺可再以 Figma 高保真稿呈現。

---

## 4. UI 元件規格表

| 類型     | 元件名稱          | 關鍵屬性                                                 | 說明                      |
| ------ | ------------- | ---------------------------------------------------- | ----------------------- |
| Button | PrimaryButton | size: `md / lg`state: `default / loading / disabled` | 全域主行為，例如「送出」            |
| Button | IconButton    | iconOnly                                             | 拍照、上傳                   |
| Card   | AnswerCard    | header, body, footer                                 | 用於 AI 解題結果；支援 Accordion |
| Input  | QuestionInput | multiline                                            | 輸入文字問題                  |
| Image  | UploadedImage | preview, enlarge                                     | 顯示使用者上傳的圖片              |
| Toast  | ErrorToast    | type: `error / success`                              | 容錯提示                    |
| List   | ThreadList    | threads, onSelect, onNew                             | Thread 列表，支援選擇和新建      |

---

## 5. 系統架構與技術選型

- **前端**：React + Next.js 14 / App Router、Tailwind CSS、Shadcn/ui、Vercel 部署
- **圖片處理**：Cloudinary（上傳、壓縮、裁切）
- **後端**：Next.js API Routes (TypeScript) 提供 RESTful API
- **AI 引擎**：OpenAI GPT‑4o (Chat Completion) + LaTeX 渲染
- **資料庫**：Firebase Firestore
- **認證**：Firebase Authentication

---

## 6. API 介面設計

| Method | Endpoint | Body / Params              | 回傳                          | 備註          |
| ------ | -------- | -------------------------- | --------------------------- | ----------- |
| POST   | /api/solver | `{ message, userId, questionImageUrl, threadId?, isNewThread? }` | `{ message, threadId, isNewThread }` | 主要解題 API |
| GET    | /api/solver/threads | `userId`                   | `{ threads }`               | 獲取 Thread 列表 |
| GET    | /api/solver/threads/[threadId]/messages | `userId` | `{ messages }`              | 獲取特定 Thread 訊息 |

---

## 7. 資料結構與狀態管理

### 7.1 前端狀態

```ts
interface SolverState {
  currentThreadId: string | null;
  threads: ChatThread[];
  messages: Message[];
  loading: boolean;
  showThreadList: boolean;
}
```

### 7.2 資料庫結構

```ts
// chat_threads 集合
interface ChatThread {
  id: string;
  userId: string;
  title: string;
  hasImage: boolean;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}

// chat_messages 集合
interface ChatMessage {
  id: string;
  threadId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Timestamp;
}
```

---

## 8. Thread 功能設計

### 8.1 Thread 創建邏輯

- **新 Thread 觸發條件**：
  1. 用戶上傳新圖片
  2. 用戶點擊「新對話」按鈕
  3. 用戶首次使用（無現有 Thread）

- **Thread 延續條件**：
  1. 在同一 Thread 中繼續提問
  2. 不包含新圖片上傳

### 8.2 記憶機制

- **系統提示詞**：包含歷史對話記憶指令
- **上下文長度**：支援完整的 Thread 對話歷史
- **圖片記憶**：Thread 中的圖片會被記住並在後續對話中參考

### 8.3 Thread 管理

- **列表顯示**：按最後更新時間排序
- **標題生成**：自動從第一條訊息生成
- **圖片標記**：有圖片的 Thread 顯示圖示
- **刪除功能**：支援刪除不需要的 Thread

---

## 9. 設計規範（Design Tokens）

```json
{
  "colorPrimary": "#3B82F6",
  "colorSecondary": "#06B6D4",
  "colorBackground": "#F9FAFB",
  "colorSurface": "#FFFFFF",
  "colorThreadActive": "#EBF8FF",
  "colorThreadBorder": "#E5E7EB",
  "radius": "0.75rem",
  "space": {
    "xs": "0.5rem",
    "sm": "0.75rem",
    "md": "1rem",
    "lg": "1.5rem"
  },
  "fontSize": {
    "body": "1rem",
    "label": "0.875rem",
    "title": "1.25rem"
  },
  "layout": {
    "sidebarWidth": "20rem",
    "maxContentWidth": "64rem"
  }
}
```

---

## 10. 實作重點

### 10.1 資料庫遷移

- 從舊的 `chat_history` 集合遷移到新的 `chat_threads` 和 `chat_messages` 集合
- 保持向後相容性，支援舊的 API 端點

### 10.2 效能優化

- Thread 列表分頁載入
- 訊息懶載入
- 圖片壓縮和快取

### 10.3 使用者體驗

- 響應式設計，支援手機和桌面
- 載入狀態和錯誤處理
- 無障礙設計支援

---

> **後續**：
>
> 1. 可於 Figma 製作高保真視覺稿。
> 2. Storybook 建 UI 元件 Demo。
> 3. 撰寫 E2E (Playwright) 測試以保障流程。
> 4. 實作 Thread 刪除和編輯功能。
> 5. 添加 Thread 分享和匯出功能。

---

**製作者：** 資深 UI/UX 設計師 · 2025‑01‑28

