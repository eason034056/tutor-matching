const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const projectRoot = process.cwd()

const readSource = (relativePath) =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

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
    if (request in mocks) {
      return mocks[request]
    }

    if (request === 'server-only') {
      return {}
    }

    if (request.startsWith('.')) {
      return require(path.resolve(dirname, request))
    }

    return require(request)
  }

  const wrapped = `(function (exports, require, module, __filename, __dirname) { ${transpiled}\n})`
  const script = new vm.Script(wrapped, { filename: filePath })
  const fn = script.runInThisContext()
  fn(module.exports, localRequire, module, filePath, dirname)
  return module.exports
}

test('case upload form no longer sends new-case admin webhooks from the client', () => {
  const source = readSource('components/case-upload-form.tsx')

  assert.doesNotMatch(source, /sendWebhookNotification/)
  assert.doesNotMatch(source, /webhook-config/)
})

test('webhook config no longer routes new_case notifications through webhook config', () => {
  const source = readSource('webhook-config.ts')

  assert.doesNotMatch(source, /'new_case'/)
})

test('admin case review notification builder uses redesigned budget and address fields', async () => {
  const modulePath = path.join(projectRoot, 'lib/notifications/admin-case-review.ts')
  assert.ok(fs.existsSync(modulePath), 'expected admin case review notification module to exist')

  const { buildAdminCaseReviewNotificationData } = loadTsModule('lib/notifications/admin-case-review.ts', {
    nodemailer: { createTransport: () => ({ sendMail: async () => ({}) }) },
    '@/lib/address-utils': {
      buildLocationSummary: () => '不應該使用備援地址摘要',
    },
    '@/lib/firebase/firebase-admin': {
      adminDb: {},
    },
  })

  const data = buildAdminCaseReviewNotificationData(
    {
      caseNumber: 'CS2WI6O',
      parentName: '吳珈穆',
      parentPhone: '0918837352',
      parentEmail: '',
      subject: '國中國文',
      grade: '國二',
      region: '新竹市',
      location: '新竹市東區光復路，近清大',
      budgetRange: 'NT$500-700 / 時',
      availableTime: '平日晚上',
      studentDescription: '校內功課+會考',
      teacherRequirements: '有帶國中會考經驗',
      message: '',
    },
    { siteUrl: 'https://tutor-matching.tw' }
  )

  assert.equal(data.displayBudget, 'NT$500-700 / 時')
  assert.equal(data.displayAddress, '新竹市東區光復路，近清大')
  assert.equal(data.adminUrl, 'https://tutor-matching.tw/admin')
})

test('admin case review notification builder falls back to hourly fee and legacy address', async () => {
  const { buildAdminCaseReviewNotificationData } = loadTsModule('lib/notifications/admin-case-review.ts', {
    nodemailer: { createTransport: () => ({ sendMail: async () => ({}) }) },
    '@/lib/address-utils': {
      buildLocationSummary: () => '',
    },
    '@/lib/firebase/firebase-admin': {
      adminDb: {},
    },
  })

  const data = buildAdminCaseReviewNotificationData(
    {
      caseNumber: 'CLEGACY1',
      parentName: '王小明',
      parentPhone: '0912000000',
      subject: '高中英文',
      grade: '高一',
      region: '臺北市',
      address: '臺北市大安區和平東路二段',
      hourlyFee: 900,
      availableTime: '週六下午',
      studentDescription: '段考加強',
      teacherRequirements: '',
      message: '請先電話聯絡',
    },
    { siteUrl: 'https://tutor-matching.tw/' }
  )

  assert.equal(data.displayBudget, 'NT$900/時')
  assert.equal(data.displayAddress, '臺北市大安區和平東路二段')
  assert.equal(data.adminUrl, 'https://tutor-matching.tw/admin')
})

test('admin recipient loader normalizes, deduplicates, and skips missing emails', async () => {
  const { loadAdminRecipientEmails } = loadTsModule('lib/notifications/admin-case-review.ts', {
    nodemailer: { createTransport: () => ({ sendMail: async () => ({}) }) },
    '@/lib/address-utils': {
      buildLocationSummary: () => '',
    },
    '@/lib/firebase/firebase-admin': {
      adminDb: {
        collection: () => ({
          get: async () => ({
            docs: [
              { data: () => ({ email: 'Admin@One.com ' }) },
              { data: () => ({ email: 'admin@one.com' }) },
              { data: () => ({ email: 'ops@two.com' }) },
              { data: () => ({ email: '' }) },
              { data: () => ({}) },
            ],
          }),
        }),
      },
    },
  })

  const emails = await loadAdminRecipientEmails()

  assert.deepEqual(emails, ['admin@one.com', 'ops@two.com'])
})

test('case normalization accepts string hourlyFee for new cases and numeric hourlyFee for legacy cases', async () => {
  const { normalizeBudgetRange } = loadTsModule('lib/case-utils.ts', {
    '@/lib/address-utils': {
      buildLocationSummary: () => '',
    },
  })

  assert.equal(normalizeBudgetRange(undefined, 'NT$500-700 / 時'), 'NT$500-700 / 時')
  assert.equal(normalizeBudgetRange(undefined, 900), 'NT$900/時')
})

test('admin mailer sends normalized fields and admin link via SMTP transport', async () => {
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
    const { sendAdminCaseReviewEmail } = loadTsModule('lib/notifications/admin-case-review.ts', {
      nodemailer: {
        createTransport: () => ({
          sendMail: async (options) => {
            sentMessage = options
            return { messageId: 'msg-1' }
          },
        }),
      },
      '@/lib/address-utils': {
        buildLocationSummary: () => '',
      },
      '@/lib/firebase/firebase-admin': {
        adminDb: {},
      },
    })

    await sendAdminCaseReviewEmail({
      recipientEmails: ['admin@one.com'],
      notification: {
        caseNumber: 'CS2WI6O',
        parentName: '吳珈穆',
        parentPhone: '0918837352',
        parentEmail: '',
        subject: '國中國文',
        grade: '國二',
        region: '新竹市',
        displayAddress: '新竹市東區光復路，近清大',
        displayBudget: 'NT$500-700 / 時',
        availableTime: '平日晚上',
        studentDescription: '校內功課+會考',
        teacherRequirements: '有帶國中會考經驗',
        message: '',
        adminUrl: 'https://tutor-matching.tw/admin',
      },
    })

    assert.ok(sentMessage, 'expected sendMail to be called')
    assert.equal(sentMessage.subject, '新案件通知 - 國中國文')
    assert.equal(sentMessage.to, 'admin@one.com')
    assert.match(sentMessage.html, /聯絡地址：新竹市東區光復路，近清大/)
    assert.match(sentMessage.html, /期望預算：NT\$500-700 \/ 時/)
    assert.match(sentMessage.html, /https:\/\/tutor-matching\.tw\/admin/)
    assert.match(sentMessage.text, /補充說明：N\/A/)
  } finally {
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key]
      }
    })
    Object.assign(process.env, originalEnv)
  }
})

test('case upload route still returns success when admin notification sending fails', async () => {
  let savedPayload = null
  let notifiedPayload = null

  const { POST } = loadTsModule('app/api/cases/upload/route.ts', {
    'next/server': {
      NextResponse: class NextResponse extends Response {},
    },
    '@/server/config/firebase': {
      casesCollection: { id: 'cases' },
    },
    'firebase/firestore': {
      addDoc: async (_collection, payload) => {
        savedPayload = payload
        return { id: 'doc-1' }
      },
    },
    uuid: {
      v4: () => 'uuid-1',
    },
    '@/lib/address-utils': {
      buildLocationSummary: () => '不應該使用結構化地址備援',
    },
    '@/lib/notifications/admin-case-review': {
      notifyNewCaseAdmins: async (payload) => {
        notifiedPayload = payload
        throw new Error('SMTP unavailable')
      },
    },
  })

  const response = await POST({
    json: async () => ({
      caseNumber: 'CS2WI6O',
      parentName: '吳珈穆',
      parentPhone: '0918837352',
      subject: '國中國文',
      grade: '國二',
      location: '新竹市東區光復路，近清大',
      budgetRange: 'NT$500-700 / 時',
      availableTime: '平日晚上',
      studentDescription: '校內功課+會考',
      teacherRequirements: '有帶國中會考經驗',
    }),
  })

  const result = JSON.parse(await response.text())

  assert.equal(response.status, 201)
  assert.equal(result.success, true)
  assert.equal(savedPayload.id, 'uuid-1')
  assert.equal(savedPayload.pending, 'pending')
  assert.equal(savedPayload.documentStatus, 'not_requested')
  assert.equal(savedPayload.hourlyFee, 'NT$500-700 / 時')
  assert.equal(savedPayload.address, '新竹市東區光復路，近清大')
  assert.equal(Object.hasOwn(savedPayload, 'budgetRange'), false)
  assert.equal(notifiedPayload.id, 'uuid-1')
  assert.equal(notifiedPayload.hourlyFee, 'NT$500-700 / 時')
  assert.equal(notifiedPayload.address, '新竹市東區光復路，近清大')
})

test('case upload route rebuilds legacy address from structured address fields when location is missing', async () => {
  let savedPayload = null

  const { POST } = loadTsModule('app/api/cases/upload/route.ts', {
    'next/server': {
      NextResponse: class NextResponse extends Response {},
    },
    '@/server/config/firebase': {
      casesCollection: { id: 'cases' },
    },
    'firebase/firestore': {
      addDoc: async (_collection, payload) => {
        savedPayload = payload
        return { id: 'doc-2' }
      },
    },
    uuid: {
      v4: () => 'uuid-2',
    },
    '@/lib/address-utils': {
      buildLocationSummary: ({ city, district, roadName, landmark }) =>
        `${city}${district}${roadName}，近${landmark}`,
    },
    '@/lib/notifications/admin-case-review': {
      notifyNewCaseAdmins: async () => {},
    },
  })

  const response = await POST({
    json: async () => ({
      caseNumber: 'CSTRUCT1',
      parentName: '測試家長',
      parentPhone: '0912000000',
      subject: '高中英文',
      city: '臺北市',
      district: '大安區',
      roadName: '和平東路二段',
      landmark: '古亭站',
      lessonMode: 'in_person',
      hourlyFee: 'NT$800-1000 / 時',
    }),
  })

  const result = JSON.parse(await response.text())

  assert.equal(response.status, 201)
  assert.equal(result.success, true)
  assert.equal(savedPayload.address, '臺北市大安區和平東路二段，近古亭站')
})
