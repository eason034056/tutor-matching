import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import hljs from 'highlight.js';
import 'katex/dist/katex.min.css';

// 將 \[...\]、\(...\) 轉成 $$...$$、$...$，讓 remark-math 能正確解析
function normalizeDelimiters(src: string) {
  return src
    .replace(/\\\[/g, '$$')   // \[  -> $$
    .replace(/\\\]/g, '$$')   // \]  -> $$
    .replace(/\\\(/g, '$')    // \(  -> $
    .replace(/\\\)/g, '$');   // \)  -> $
}

export function MarkdownMessage({ children }: { children: string }) {
  return (
    <div className="prose max-w-none prose-sm sm:prose-base break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ inline, className, children }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
            const lang = /language-(\w+)/.exec(className || '')?.[1];
            if (inline) {
              return (
                <code className="px-1 py-0.5 bg-gray-100 rounded">
                  {children}
                </code>
              );
            }
            const codeString = Array.isArray(children) ? children.join('') : String(children);
            const html = lang
              ? hljs.highlight(codeString, { language: lang }).value
              : hljs.highlightAuto(codeString).value;
            return (
              <pre className="p-3 bg-gray-100 rounded overflow-x-auto">
                <code dangerouslySetInnerHTML={{ __html: html }} />
              </pre>
            );
          },
          a: (props: React.ComponentPropsWithoutRef<'a'>) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {normalizeDelimiters(children)}
      </ReactMarkdown>
    </div>
  );
} 