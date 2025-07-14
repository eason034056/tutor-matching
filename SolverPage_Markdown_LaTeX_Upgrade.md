
# SolverPage UI 渲染層改造筆記  
同時支援 **Markdown + LaTeX (KaTeX)**，打造 ChatGPT‑style 公式／程式碼／GFM 效果  

---

## 1. 套件安裝

```bash
npm i react-markdown remark-gfm remark-math rehype-katex katex highlight.js
```

| 套件 | 功能 |
|------|------|
| `react-markdown` | Markdown 解析核心 |
| `remark-gfm` | GFM 擴充：表格、待辦清單、刪除線 |
| `remark-math` | 偵測 `$…$、$$…$$、\(…\)、\[…\]` 數學區塊 |
| `rehype-katex` | 使用 KaTeX 將數學節點轉成 HTML |
| `katex` | KaTeX 本體及 CSS |
| `highlight.js` | 程式碼區塊語法上色（可選） |

> **樣式**  
> ```ts
> // _app.tsx or globals.css
> import 'katex/dist/katex.min.css';
> ```

---

## 2. 移除／汰換

* 刪除 `autoWrapLatex()` 與 `MessageWithLatex` 兩段自製 Regex + KaTeX 邏輯  
* 不再手動呼叫 `katex.renderToString()`  

Markdown ⇨ `remark-math` ⇨ `rehype-katex` 會自動完成包裝與轉譯。

---

## 3. 新增 `<MarkdownMessage />` 元件

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import hljs from 'highlight.js';

export function MarkdownMessage({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      linkTarget="_blank"
      className="prose max-w-none prose-sm sm:prose-base break-words"
      components={{
        code({ inline, className, children, ...props }) {
          const lang =
            /language-(\w+)/.exec(className || '')?.[1];
          if (inline) {
            return (
              <code className="px-1 py-0.5 bg-gray-100 rounded">
                {children}
              </code>
            );
          }
          const html = lang
            ? hljs.highlight(children as string, { language: lang }).value
            : hljs.highlightAuto(children as string).value;
          return (
            <pre className="p-3 bg-gray-100 rounded overflow-x-auto">
              <code dangerouslySetInnerHTML={{ __html: html }} />
            </pre>
          );
        },
      }}
      {...props}
    >
      {children}
    </ReactMarkdown>
  );
}
```

---

## 4. 聊天訊息渲染點替換

```diff
- <MessageWithLatex text={autoWrapLatex(message.content || '')} />
+ <MarkdownMessage>{message.content || ''}</MarkdownMessage>
```

將所有 AI／User 訊息泡泡的渲染元件都換成 `MarkdownMessage`。

---

## 5. UI / CSS 調整建議

| 區域 | 動作 |
|------|------|
| `.chat-messages` | 加 `prose w-full` 或 `max-w-*`，避免 KaTeX/表格撐破泡泡 |
| `.prose` | 加 `leading-relaxed` 讓公式行高不擁擠 |
| 深色模式 | 覆寫 KaTeX CSS 或加 `dark:prose-invert` |
| 語法反白主題 | `import 'highlight.js/styles/github.css'` (或愛用主題) |

---

## 6. UX 微優化

* **公式點擊複製**：在 `components.math` 中加入自訂 `<span data-math>`，點擊複製原始 `$···$`  
* **拖曳防選取**：公式元素加 `select-none`  
* **Skeleton**：維持現有 loading 骨架即可

---

## 7. 版本相容

* React ≥18，建議 `react-markdown@9`  
* Next.js 13/14：如遇 CJS 套件問題，可用 `next-transpile-modules` 轉譯 `rehype-katex`  
* 若出現 `rehype-katex` ESM 警告，可改用 `rehype-katex-cjs` 或升級最新版  

---

完成以上修改後，SolverPage 將能 **零痛點** 地呈現 Markdown + LaTeX，版面與 ChatGPT 相同，保留 Tailwind 風格與行動裝置適應性。如果需要更多細節或整合協助，歡迎再敲我 🚀
