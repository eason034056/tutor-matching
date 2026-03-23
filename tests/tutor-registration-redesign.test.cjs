const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const readSource = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')

test('tutor registration page uses the mobile-first onboarding hero and trust points', () => {
  const source = readSource('app/tutor-registration/page.tsx')

  assert.match(source, /TEACHER ONBOARDING/)
  assert.match(source, /三步完成老師登錄/)
  assert.match(source, /證件選檔即上傳/)
})

test('tutor registration form uses three-step wizard flow with immediate upload hook', () => {
  const source = readSource('components/tutor-registration-form.tsx')

  assert.match(source, /stepConfigs/)
  assert.match(source, /基本資料/)
  assert.match(source, /教學背景/)
  assert.match(source, /證件與送出/)
  assert.match(source, /useTutorDocumentUpload/)
  assert.match(source, /selectFile/)
  assert.match(source, /retryUpload/)
  assert.match(source, /isAnyUploading/)
})

test('resubmission page reuses the same tutor registration form in resubmission mode', () => {
  const source = readSource('app/tutor-resubmission/[token]/page.tsx')

  assert.match(source, /TutorRegistrationForm/)
  assert.match(source, /mode="resubmission"/)
  assert.match(source, /電話末三碼/)
})

test('documents step displays visible watermark overlay and HEIC support hint', () => {
  const source = readSource('components/tutor-registration/documents-step.tsx')

  assert.match(source, /僅供青椒老師家教中心使用/)
  assert.match(source, /HEIC/)
})
