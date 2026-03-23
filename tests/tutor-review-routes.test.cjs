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

const createNextServerMock = () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      body,
    }),
  },
})

test('request revision route validates note for other reason', async () => {
  const { POST } = loadTsModule('app/api/admin/tutors/[docId]/request-revision/route.ts', {
    'next/server': createNextServerMock(),
    '@/lib/firebase/firebase-admin': {
      adminDb: {
        collection: () => ({
          doc: () => ({
            get: async () => ({ exists: true, data: () => ({ name: '王小明', email: 'teacher@example.com', phoneNumber: '0912345678' }) }),
            update: async () => {},
          }),
        }),
      },
    },
    '@/lib/document-utils': {
      generateDocumentToken: () => 'token-123',
      hashDocumentToken: () => 'hashed-token-123',
      createDocumentExpiryIso: () => '2026-03-30T08:00:00.000Z',
    },
    '@/lib/notifications/tutor-review': {
      validateTutorRevisionRequest: ({ reasonCodes, note }) => {
        if (reasonCodes.includes('other') && !note.trim()) {
          throw new Error('請補充退件說明')
        }
      },
      buildTutorRevisionRequestNotificationData: () => ({}),
      sendTutorRevisionRequestEmail: async () => ({}),
    },
  })

  const response = await POST(
    {
      json: async () => ({
        reasonCodes: ['other'],
        note: '   ',
      }),
    },
    { params: Promise.resolve({ docId: 'doc-1' }) }
  )

  assert.equal(response.status, 400)
  assert.equal(response.body.error, '請補充退件說明')
})

test('request revision route stores revision status and token fields', async () => {
  const updates = []
  let sentEmail = null

  const { POST } = loadTsModule('app/api/admin/tutors/[docId]/request-revision/route.ts', {
    'next/server': createNextServerMock(),
    '@/lib/firebase/firebase-admin': {
      adminDb: {
        collection: () => ({
          doc: () => ({
            get: async () => ({
              exists: true,
              data: () => ({
                name: '王小明',
                email: 'teacher@example.com',
                phoneNumber: '0912345678',
              }),
            }),
            update: async (payload) => {
              updates.push(payload)
            },
          }),
        }),
      },
    },
    '@/lib/document-utils': {
      generateDocumentToken: () => 'token-123',
      hashDocumentToken: () => 'hashed-token-123',
      createDocumentExpiryIso: () => '2026-03-30T08:00:00.000Z',
    },
    '@/lib/notifications/tutor-review': {
      validateTutorRevisionRequest: ({ reasonCodes, note }) => ({ reasonCodes, note }),
      buildTutorRevisionRequestNotificationData: (payload) => payload,
      sendTutorRevisionRequestEmail: async (payload) => {
        sentEmail = payload
        return { messageId: 'msg-1' }
      },
    },
  })

  const response = await POST(
    {
      json: async () => ({
        reasonCodes: ['student_id_unreadable'],
        note: '請重新上傳清晰照片',
      }),
    },
    { params: Promise.resolve({ docId: 'doc-1' }) }
  )

  assert.equal(response.status, 200)
  assert.equal(updates[0].status, 'revision_requested')
  assert.equal(updates[0].revisionTokenHash, 'hashed-token-123')
  assert.deepEqual(updates[0].revisionReasonCodes, ['student_id_unreadable'])
  assert.equal(sentEmail.recipientEmail, 'teacher@example.com')
})

test('approve route updates tutor through adminDb and sends approval email', async () => {
  const tutorUpdates = []
  const approvedSets = []
  let sentEmail = null

  const tutorRef = {
    get: async () => ({
      exists: true,
      data: () => ({
        id: 'tutor-id-1',
        tutorCode: 'T12345',
        experience: '三年',
        expertise: '會考衝刺',
        major: '數學系',
        name: '王小明',
        email: 'teacher@example.com',
        school: '清大',
        subjects: ['國中數學'],
        receiveNewCaseNotifications: true,
      }),
    }),
    update: async (payload) => {
      tutorUpdates.push(payload)
    },
  }

  const approvedTutorRef = {
    set: async (payload) => {
      approvedSets.push(payload)
    },
    delete: async () => {},
  }

  const { POST } = loadTsModule('app/api/admin/tutors/[docId]/approve/route.ts', {
    'next/server': createNextServerMock(),
    '@/lib/firebase/firebase-admin': {
      adminDb: {
        collection: (name) => ({
          doc: () => (name === 'tutors' ? tutorRef : approvedTutorRef),
        }),
      },
    },
    '@/lib/notifications/tutor-review': {
      buildTutorApprovalNotificationData: (payload) => ({
        ...payload,
        processUrl: 'https://tutor-matching.tw/process',
        tutorCasesUrl: 'https://tutor-matching.tw/tutor-cases',
        lineId: 'home-tutor-tw',
      }),
      sendTutorApprovalEmail: async (payload) => {
        sentEmail = payload
      },
    },
  })

  const response = await POST(
    {},
    { params: Promise.resolve({ docId: 'doc-1' }) }
  )

  assert.equal(response.status, 200)
  assert.equal(tutorUpdates[0].status, 'approved')
  assert.equal(approvedSets[0].tutorCode, 'T12345')
  assert.equal(sentEmail.recipientEmail, 'teacher@example.com')
})

test('resubmission submit route restores tutor to pending status', async () => {
  const updates = []

  const { POST } = loadTsModule('app/api/tutor-resubmission/[token]/submit/route.ts', {
    'next/server': createNextServerMock(),
    'firebase/firestore': {
      getDocs: async () => ({
        empty: false,
        docs: [
          {
            ref: { id: 'doc-1' },
            data: () => ({
              phoneNumber: '0912345678',
              revisionExpiresAt: '2099-03-30T08:00:00.000Z',
              studentIdCardUrl: 'old-student',
              idCardUrl: 'old-id',
            }),
          },
        ],
      }),
      query: (...args) => args,
      where: (...args) => args,
      updateDoc: async (_ref, payload) => {
        updates.push(payload)
      },
    },
    '@/server/config/firebase': {
      tutorsCollection: {},
    },
    '@/lib/document-utils': {
      hashDocumentToken: () => 'hashed-token-123',
      getPhoneTail: () => '678',
      isDocumentRequestExpired: () => false,
    },
  })

  const response = await POST(
    {
      json: async () => ({
        phoneTail: '678',
        name: '王小明',
        email: 'teacher@example.com',
        phoneNumber: '0912345678',
        subjects: ['國中數學'],
        experience: '三年',
        school: '清大',
        major: '數學系',
        expertise: '會考衝刺',
        studentIdCardUrl: 'new-student',
        idCardUrl: 'new-id',
      }),
    },
    { params: Promise.resolve({ token: 'token-123' }) }
  )

  assert.equal(response.status, 200)
  assert.equal(updates[0].status, 'pending')
  assert.equal(updates[0].revisionTokenHash, null)
  assert.equal(updates[0].revisionSubmittedAt !== undefined, true)
  assert.deepEqual(updates[0].subjects, ['國中數學'])
})

test('admin page delegates tutor approval and revision requests to server routes', () => {
  const source = fs.readFileSync(path.join(projectRoot, 'app/admin/page.tsx'), 'utf8')

  assert.match(source, /request-revision/)
  assert.match(source, /退回補件/)
  assert.match(source, /TUTOR_REVISION_REASON_OPTIONS/)
  assert.match(source, /fetch\(`\/api\/admin\/tutors\/\$\{docId\}\/approve`/)
})

test('admin tutor review routes use Firebase Admin SDK for server-side Firestore access', () => {
  const approveSource = fs.readFileSync(path.join(projectRoot, 'app/api/admin/tutors/[docId]/approve/route.ts'), 'utf8')
  const revisionSource = fs.readFileSync(path.join(projectRoot, 'app/api/admin/tutors/[docId]/request-revision/route.ts'), 'utf8')

  assert.match(approveSource, /@\/lib\/firebase\/firebase-admin/)
  assert.match(revisionSource, /@\/lib\/firebase\/firebase-admin/)
  assert.doesNotMatch(approveSource, /firebase\/firestore/)
  assert.doesNotMatch(revisionSource, /firebase\/firestore/)
})

test('tutor resubmission page verifies token before rendering shared form', () => {
  const source = fs.readFileSync(path.join(projectRoot, 'app/tutor-resubmission/[token]/page.tsx'), 'utf8')

  assert.match(source, /\/api\/tutor-resubmission\/\$\{token\}\/verify/)
  assert.match(source, /TutorRegistrationForm/)
  assert.match(source, /電話末三碼/)
})
