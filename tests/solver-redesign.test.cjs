const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const readSource = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

test('solver page delegates to SolverShell entry component', () => {
  const source = readSource('app/solver/page.tsx')

  assert.match(source, /import SolverShell from '\@\/components\/solver\/SolverShell'/)
  assert.match(source, /return <SolverShell \/>/)
})

test('solver shell provides mobile-first shell marker and desktop two-column layout marker', () => {
  const source = readSource('components/solver/SolverShell.tsx')

  assert.match(source, /data-solver-mobile-first/)
  assert.match(source, /data-solver-desktop-two-column/)
  assert.match(source, /<SolverThreadDrawer/)
  assert.match(source, /<SolverThreadRail/)
})

test('solver question and chat views keep timeout and retry affordances', () => {
  const questionSource = readSource('components/solver/SolverQuestionStep.tsx')
  const chatSource = readSource('components/solver/SolverChatView.tsx')

  assert.match(questionSource, /處理時間過長/)
  assert.match(questionSource, /重試/)
  assert.match(chatSource, /處理時間過長/)
  assert.match(chatSource, /重試/)
})

test('solver presets include subject-specific quick prompts', () => {
  const source = readSource('components/solver/solverPresets.ts')

  assert.match(source, /請列出詳細步驟/)
  assert.match(source, /請解釋關鍵概念/)
  assert.match(source, /Record<SubjectType, string\[]>/)
})

test('solver display typography hook is wired to Noto Serif TC', () => {
  const layoutSource = readSource('app/solver/layout.tsx')
  const moduleSource = readSource('components/solver/solver.module.css')

  assert.match(layoutSource, /--font-solver-display/)
  assert.match(layoutSource, /Noto_Serif_TC/)
  assert.match(moduleSource, /var\(--font-solver-display\)/)
})

test('solver API auto-generates thread title from first assistant answer', () => {
  const source = readSource('app/api/solver/route.ts')

  assert.match(source, /async function generateThreadTitleWithDeepSeek/)
  assert.match(source, /model:\s*'deepseek\/deepseek-chat-v3-0324'/)
  assert.match(source, /第一則 AI 回答/)
  assert.match(source, /if \(isNewThreadCreated && currentThreadId && threadCreatedAt\)/)
  assert.match(source, /generateThreadTitleWithDeepSeek\(message,\s*aiResponse,\s*threadCreatedAt\)/)
})
