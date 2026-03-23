const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const projectRoot = process.cwd()

const loadTsModule = (relativePath, mocks = {}) => {
  const filePath = path.join(projectRoot, relativePath)
  const source = fs.readFileSync(filePath, 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filePath,
  }).outputText

  const module = { exports: {} }
  const dirname = path.dirname(filePath)

  const loadProjectModule = (request) => {
    const basePath = request.startsWith('@/')
      ? path.join(projectRoot, request.slice(2))
      : path.resolve(dirname, request)

    const candidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, path.join(basePath, 'index.ts')]
    const resolvedPath = candidates.find((candidate) => fs.existsSync(candidate))

    if (resolvedPath && /\.(ts|tsx)$/.test(resolvedPath)) {
      return loadTsModule(path.relative(projectRoot, resolvedPath), mocks)
    }

    if (resolvedPath) {
      return require(resolvedPath)
    }

    return require(basePath)
  }

  const localRequire = (request) => {
    if (request in mocks) {
      return mocks[request]
    }

    if (request === 'server-only') {
      return {}
    }

    if (request.startsWith('.') || request.startsWith('@/')) {
      return loadProjectModule(request)
    }

    return require(request)
  }

  const wrapped = `(function (exports, require, module, __filename, __dirname) { ${transpiled}\n})`
  const script = new vm.Script(wrapped, { filename: filePath })
  const fn = script.runInThisContext()
  fn(module.exports, localRequire, module, filePath, dirname)
  return module.exports
}

test('approval notification builder includes tutor code and next-step links', async () => {
  const modulePath = path.join(projectRoot, 'lib/notifications/tutor-review.ts')
  assert.ok(fs.existsSync(modulePath), 'expected tutor review notification module to exist')

  const { buildTutorApprovalNotificationData } = loadTsModule('lib/notifications/tutor-review.ts', {
    nodemailer: { createTransport: () => ({ sendMail: async () => ({}) }) },
  })

  const data = buildTutorApprovalNotificationData(
    {
      name: '王小明',
      tutorCode: 'T12345',
      receiveNewCaseNotifications: true,
    },
    { siteUrl: 'https://tutor-matching.tw' }
  )

  assert.equal(data.name, '王小明')
  assert.equal(data.tutorCode, 'T12345')
  assert.equal(data.processUrl, 'https://tutor-matching.tw/process')
  assert.equal(data.tutorCasesUrl, 'https://tutor-matching.tw/tutor-cases')
  assert.equal(data.lineId, 'home-tutor-tw')
  assert.equal(data.receiveNewCaseNotifications, true)
})

test('revision request notification builder maps reason codes and token link', async () => {
  const { buildTutorRevisionRequestNotificationData } = loadTsModule('lib/notifications/tutor-review.ts', {
    nodemailer: { createTransport: () => ({ sendMail: async () => ({}) }) },
  })

  const data = buildTutorRevisionRequestNotificationData(
    {
      name: '陳老師',
      revisionReasonCodes: ['student_id_unreadable', 'other'],
      revisionNote: '學生證邊角被遮住，請重新拍攝。',
      revisionPath: '/tutor-resubmission/token-123',
      revisionExpiresAt: '2026-03-30T08:00:00.000Z',
    },
    { siteUrl: 'https://tutor-matching.tw' }
  )

  assert.deepEqual(data.reasonLabels, ['學生證照片無法清楚辨識', '其他需要補充的內容'])
  assert.equal(data.revisionUrl, 'https://tutor-matching.tw/tutor-resubmission/token-123')
  assert.equal(data.revisionNote, '學生證邊角被遮住，請重新拍攝。')
  assert.match(data.formattedExpiry, /2026/)
})

test('revision request validator requires note when other reason is selected', async () => {
  const { validateTutorRevisionRequest } = loadTsModule('lib/notifications/tutor-review.ts', {
    nodemailer: { createTransport: () => ({ sendMail: async () => ({}) }) },
  })

  assert.throws(
    () => validateTutorRevisionRequest({ reasonCodes: ['other'], note: '   ' }),
    /請補充退件說明/
  )
})

test('approval sender uses SMTP transport with branded subject', async () => {
  const originalEnv = { ...process.env }
  let sentMessage = null

  process.env.SMTP_HOST = 'smtp.example.com'
  process.env.SMTP_PORT = '465'
  process.env.SMTP_SECURE = 'true'
  process.env.SMTP_USER = 'mailer@example.com'
  process.env.SMTP_PASS = 'secret'
  process.env.SMTP_FROM_EMAIL = 'contact@tutor-matching.tw'
  process.env.SMTP_FROM_NAME = '青椒老師家教中心'

  try {
    const { sendTutorApprovalEmail } = loadTsModule('lib/notifications/tutor-review.ts', {
      nodemailer: {
        createTransport: () => ({
          sendMail: async (options) => {
            sentMessage = options
            return { messageId: 'msg-approval' }
          },
        }),
      },
    })

    await sendTutorApprovalEmail({
      recipientEmail: 'teacher@example.com',
      notification: {
        name: '王小明',
        tutorCode: 'T12345',
        processUrl: 'https://tutor-matching.tw/process',
        tutorCasesUrl: 'https://tutor-matching.tw/tutor-cases',
        lineId: 'home-tutor-tw',
        receiveNewCaseNotifications: false,
      },
    })

    assert.equal(sentMessage.to, 'teacher@example.com')
    assert.match(sentMessage.subject, /教師審核已通過/)
    assert.match(sentMessage.html, /T12345/)
    assert.match(sentMessage.text, /home-tutor-tw/)
  } finally {
    process.env = originalEnv
  }
})
