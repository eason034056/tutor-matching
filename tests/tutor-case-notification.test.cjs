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
    },
    fileName: filePath,
  }).outputText

  const module = { exports: {} }
  const dirname = path.dirname(filePath)

  const localRequire = (request) => {
    if (request in mocks) return mocks[request]
    if (request === 'server-only') return {}
    if (request.startsWith('.')) return require(path.resolve(dirname, request))
    return require(request)
  }

  const wrapped = `(function (exports, require, module, __filename, __dirname) { ${transpiled}\n})`
  const script = new vm.Script(wrapped, { filename: filePath })
  const fn = script.runInThisContext()
  fn(module.exports, localRequire, module, filePath, dirname)
  return module.exports
}

// ── 基本 mock 工廠 ──

const baseMocks = (overrides = {}) => ({
  nodemailer: {
    createTransport: () => ({
      sendMail: async (options) => {
        if (overrides.onSendMail) overrides.onSendMail(options)
        return { messageId: 'test-msg-1' }
      },
    }),
  },
  '@/lib/firebase/firebase-admin': {
    adminDb: overrides.adminDb || {},
  },
})

const loadModule = (overrides = {}) =>
  loadTsModule('lib/notifications/tutor-case-notification.ts', baseMocks(overrides))

// ── buildTutorCaseNotificationData 測試 ──

test('buildTutorCaseNotificationData 正確處理完整案件資料', () => {
  const { buildTutorCaseNotificationData } = loadModule()

  const data = buildTutorCaseNotificationData(
    {
      caseNumber: 'CS001',
      subject: '國中數學',
      budgetRange: 'NT$500-700 / 時',
      location: '臺北市大安區',
      availableTime: '平日晚上',
      teacherRequirements: '需有教學經驗',
      studentDescription: '準備會考',
    },
    { siteUrl: 'https://tutor-matching.tw' }
  )

  assert.equal(data.caseNumber, 'CS001')
  assert.equal(data.subject, '國中數學')
  assert.equal(data.displayBudget, 'NT$500-700 / 時')
  assert.equal(data.location, '臺北市大安區')
  assert.equal(data.availableTime, '平日晚上')
  assert.equal(data.teacherRequirements, '需有教學經驗')
  assert.equal(data.studentDescription, '準備會考')
  assert.equal(data.tutorCasesUrl, 'https://tutor-matching.tw/tutor-cases')
})

test('buildTutorCaseNotificationData 用 hourlyFee 數字作為預算備援', () => {
  const { buildTutorCaseNotificationData } = loadModule()

  const data = buildTutorCaseNotificationData({
    caseNumber: 'CS002',
    subject: '高中英文',
    hourlyFee: 800,
    location: '線上',
    availableTime: '週末',
  })

  assert.equal(data.displayBudget, 'NT$800/時')
})

test('buildTutorCaseNotificationData 用 hourlyFee 字串作為預算備援', () => {
  const { buildTutorCaseNotificationData } = loadModule()

  const data = buildTutorCaseNotificationData({
    caseNumber: 'CS003',
    subject: '國小作文',
    hourlyFee: 'NT$400-600 / 時',
    location: '新竹市',
    availableTime: '平日下午',
  })

  assert.equal(data.displayBudget, 'NT$400-600 / 時')
})

test('buildTutorCaseNotificationData 沒有預算資料時顯示未填預算', () => {
  const { buildTutorCaseNotificationData } = loadModule()

  const data = buildTutorCaseNotificationData({
    caseNumber: 'CS004',
    subject: '鋼琴',
    location: '桃園市',
    availableTime: '週六上午',
  })

  assert.equal(data.displayBudget, '未填預算')
})

test('buildTutorCaseNotificationData 缺少欄位時使用預設值', () => {
  const { buildTutorCaseNotificationData } = loadModule()

  const data = buildTutorCaseNotificationData({})

  assert.equal(data.caseNumber, '未填案件編號')
  assert.equal(data.subject, '未填需求科目')
  assert.equal(data.location, '未填地點')
  assert.equal(data.availableTime, '未填可上課時段')
  assert.equal(data.teacherRequirements, '')
  assert.equal(data.studentDescription, '')
})

// ── loadTutorRecipientEmails 測試 ──

test('loadTutorRecipientEmails 只撈取有開啟通知的教師', async () => {
  const { loadTutorRecipientEmails } = loadModule({
    adminDb: {
      collection: () => ({
        get: async () => ({
          docs: [
            { data: () => ({ email: 'tutor1@example.com', receiveNewCaseNotifications: true }) },
            { data: () => ({ email: 'tutor2@example.com', receiveNewCaseNotifications: false }) },
            { data: () => ({ email: 'tutor3@example.com', receiveNewCaseNotifications: true }) },
            { data: () => ({ email: 'no-notify@example.com' }) },  // 沒設定 = 不通知
          ],
        }),
      }),
    },
  })

  const emails = await loadTutorRecipientEmails()

  assert.deepEqual(emails, ['tutor1@example.com', 'tutor3@example.com'])
})

test('loadTutorRecipientEmails 去除重複和無效 email', async () => {
  const { loadTutorRecipientEmails } = loadModule({
    adminDb: {
      collection: () => ({
        get: async () => ({
          docs: [
            { data: () => ({ email: 'Tutor@One.com ', receiveNewCaseNotifications: true }) },
            { data: () => ({ email: 'tutor@one.com', receiveNewCaseNotifications: true }) },
            { data: () => ({ email: '', receiveNewCaseNotifications: true }) },
            { data: () => ({ receiveNewCaseNotifications: true }) },  // 沒有 email
            { data: () => ({ email: 'valid@two.com', receiveNewCaseNotifications: true }) },
          ],
        }),
      }),
    },
  })

  const emails = await loadTutorRecipientEmails()

  assert.deepEqual(emails, ['tutor@one.com', 'valid@two.com'])
})

test('loadTutorRecipientEmails 沒有符合條件的教師時回傳空陣列', async () => {
  const { loadTutorRecipientEmails } = loadModule({
    adminDb: {
      collection: () => ({
        get: async () => ({
          docs: [
            { data: () => ({ email: 'tutor@example.com', receiveNewCaseNotifications: false }) },
          ],
        }),
      }),
    },
  })

  const emails = await loadTutorRecipientEmails()

  assert.deepEqual(emails, [])
})

// ── sendTutorCaseNotificationEmail 測試 ──

test('sendTutorCaseNotificationEmail 用 BCC 發送給多位教師', async () => {
  const sentMessages = []
  const originalEnv = { ...process.env }

  process.env.SMTP_HOST = 'smtp.example.com'
  process.env.SMTP_PORT = '465'
  process.env.SMTP_SECURE = 'true'
  process.env.SMTP_USER = 'mailer@example.com'
  process.env.SMTP_PASS = 'secret'
  process.env.SMTP_FROM_EMAIL = 'contact@tutor-matching.tw'
  process.env.SMTP_FROM_NAME = '青椒老師家教中心'

  try {
    const { sendTutorCaseNotificationEmail } = loadModule({
      onSendMail: (options) => { sentMessages.push(options) },
    })

    const result = await sendTutorCaseNotificationEmail({
      recipientEmails: ['tutor1@example.com', 'tutor2@example.com', 'tutor3@example.com'],
      notification: {
        caseNumber: 'CS001',
        subject: '國中數學',
        displayBudget: 'NT$500-700 / 時',
        location: '臺北市大安區',
        availableTime: '平日晚上',
        teacherRequirements: '需有教學經驗',
        studentDescription: '準備會考',
        tutorCasesUrl: 'https://tutor-matching.tw/tutor-cases',
      },
    })

    // 驗證回傳值
    assert.equal(result.skipped, false)
    assert.equal(result.recipientCount, 3)
    assert.equal(result.successCount, 3)
    assert.deepEqual(result.failedEmails, [])

    // 驗證使用 BCC 合併發送（只有 1 封郵件）
    assert.equal(sentMessages.length, 1, '預期只發送 1 封 BCC 郵件')
    assert.equal(sentMessages[0].to, 'contact@tutor-matching.tw')
    assert.equal(sentMessages[0].bcc, 'tutor1@example.com, tutor2@example.com, tutor3@example.com')

    // 驗證郵件內容
    const msg = sentMessages[0]
    assert.equal(msg.subject, '青椒老師家教中心｜新案件通知 - 國中數學')
    assert.match(msg.html, /CS001/)
    assert.match(msg.html, /國中數學/)
    assert.match(msg.html, /NT\$500-700 \/ 時/)
    assert.match(msg.html, /臺北市大安區/)
    assert.match(msg.html, /tutor-cases/)
    assert.match(msg.text, /CS001/)
  } finally {
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) delete process.env[key]
    })
    Object.assign(process.env, originalEnv)
  }
})

test('sendTutorCaseNotificationEmail BCC 發送失敗時所有收件人標記為失敗', async () => {
  const originalEnv = { ...process.env }

  process.env.SMTP_HOST = 'smtp.example.com'
  process.env.SMTP_PORT = '465'
  process.env.SMTP_SECURE = 'true'
  process.env.SMTP_USER = 'mailer@example.com'
  process.env.SMTP_PASS = 'secret'
  process.env.SMTP_FROM_EMAIL = 'contact@tutor-matching.tw'

  try {
    const { sendTutorCaseNotificationEmail } = loadModule({
      onSendMail: () => {
        throw new Error('SMTP error')
      },
    })

    const result = await sendTutorCaseNotificationEmail({
      recipientEmails: ['ok1@example.com', 'ok2@example.com', 'ok3@example.com'],
      notification: {
        caseNumber: 'CS-FAIL',
        subject: '測試',
        displayBudget: 'NT$500',
        location: '臺北市',
        availableTime: '平日',
        teacherRequirements: '',
        studentDescription: '',
        tutorCasesUrl: 'https://tutor-matching.tw/tutor-cases',
      },
    })

    // BCC 是以 chunk 為單位：SMTP 拒絕則整個 chunk 標記失敗
    assert.equal(result.successCount, 0)
    assert.equal(result.recipientCount, 3)
    assert.deepEqual(result.failedEmails, ['ok1@example.com', 'ok2@example.com', 'ok3@example.com'])
  } finally {
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) delete process.env[key]
    })
    Object.assign(process.env, originalEnv)
  }
})

test('sendTutorCaseNotificationEmail 沒有收件人時跳過發送', async () => {
  let sendMailCalled = false
  const originalEnv = { ...process.env }

  process.env.SMTP_HOST = 'smtp.example.com'
  process.env.SMTP_PORT = '465'
  process.env.SMTP_SECURE = 'true'
  process.env.SMTP_USER = 'mailer@example.com'
  process.env.SMTP_PASS = 'secret'
  process.env.SMTP_FROM_EMAIL = 'contact@tutor-matching.tw'

  try {
    const { sendTutorCaseNotificationEmail } = loadModule({
      onSendMail: () => { sendMailCalled = true },
    })

    const result = await sendTutorCaseNotificationEmail({
      recipientEmails: [],
      notification: {
        caseNumber: 'CS001',
        subject: '國中數學',
        displayBudget: 'NT$500',
        location: '臺北市',
        availableTime: '平日',
        teacherRequirements: '',
        studentDescription: '',
        tutorCasesUrl: 'https://tutor-matching.tw/tutor-cases',
      },
    })

    assert.equal(result.skipped, true)
    assert.equal(result.recipientCount, 0)
    assert.equal(result.successCount, 0)
    assert.equal(sendMailCalled, false, '不應呼叫 sendMail')
  } finally {
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) delete process.env[key]
    })
    Object.assign(process.env, originalEnv)
  }
})

// ── notifyApprovedTutors 端對端測試 ──

test('notifyApprovedTutors 完整流程：撈教師 → 組資料 → BCC 發郵件', async () => {
  const sentMessages = []
  const originalEnv = { ...process.env }

  process.env.SMTP_HOST = 'smtp.example.com'
  process.env.SMTP_PORT = '465'
  process.env.SMTP_SECURE = 'true'
  process.env.SMTP_USER = 'mailer@example.com'
  process.env.SMTP_PASS = 'secret'
  process.env.SMTP_FROM_EMAIL = 'contact@tutor-matching.tw'
  process.env.SITE_URL = 'https://tutor-matching.tw'

  try {
    const { notifyApprovedTutors } = loadModule({
      onSendMail: (options) => { sentMessages.push(options) },
      adminDb: {
        collection: () => ({
          get: async () => ({
            docs: [
              { data: () => ({ email: 'alice@example.com', receiveNewCaseNotifications: true }) },
              { data: () => ({ email: 'bob@example.com', receiveNewCaseNotifications: true }) },
              { data: () => ({ email: 'charlie@example.com', receiveNewCaseNotifications: false }) },
            ],
          }),
        }),
      },
    })

    const result = await notifyApprovedTutors({
      caseNumber: 'CS-E2E',
      subject: '高中物理',
      budgetRange: 'NT$600-900 / 時',
      location: '新竹市東區',
      availableTime: '週末下午',
      teacherRequirements: '理工科系',
      studentDescription: '高二，準備學測',
    })

    // 驗證結果
    assert.equal(result.skipped, false)
    assert.equal(result.recipientCount, 2)
    assert.equal(result.successCount, 2)

    // 驗證 BCC 發送，只包含有開啟通知的教師
    assert.equal(sentMessages.length, 1, '預期只發送 1 封 BCC 郵件')
    assert.equal(sentMessages[0].bcc, 'alice@example.com, bob@example.com')

    // 驗證郵件包含正確案件資訊
    assert.match(sentMessages[0].subject, /高中物理/)
    assert.match(sentMessages[0].html, /CS-E2E/)
    assert.match(sentMessages[0].html, /NT\$600-900 \/ 時/)
    assert.match(sentMessages[0].html, /新竹市東區/)
    assert.match(sentMessages[0].html, /tutor-cases/)
  } finally {
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) delete process.env[key]
    })
    Object.assign(process.env, originalEnv)
  }
})

test('notifyApprovedTutors 沒有符合條件的教師時跳過發送', async () => {
  let sendMailCalled = false
  const originalEnv = { ...process.env }

  process.env.SMTP_HOST = 'smtp.example.com'
  process.env.SMTP_PORT = '465'
  process.env.SMTP_SECURE = 'true'
  process.env.SMTP_USER = 'mailer@example.com'
  process.env.SMTP_PASS = 'secret'
  process.env.SMTP_FROM_EMAIL = 'contact@tutor-matching.tw'

  try {
    const { notifyApprovedTutors } = loadModule({
      onSendMail: () => { sendMailCalled = true },
      adminDb: {
        collection: () => ({
          get: async () => ({
            docs: [
              { data: () => ({ email: 'tutor@example.com', receiveNewCaseNotifications: false }) },
            ],
          }),
        }),
      },
    })

    const result = await notifyApprovedTutors({
      caseNumber: 'CS-SKIP',
      subject: '國小數學',
      location: '桃園市',
      availableTime: '平日',
    })

    assert.equal(result.skipped, true)
    assert.equal(result.recipientCount, 0)
    assert.equal(result.successCount, 0)
    assert.equal(sendMailCalled, false)
  } finally {
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) delete process.env[key]
    })
    Object.assign(process.env, originalEnv)
  }
})
