const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const projectRoot = process.cwd()

const loadTsModule = (relativePath) => {
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
    if (request.startsWith('.') || request.startsWith('@/')) {
      const basePath = request.startsWith('@/')
        ? path.join(projectRoot, request.slice(2))
        : path.resolve(dirname, request)
      const candidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, path.join(basePath, 'index.ts')]
      const resolved = candidates.find((candidate) => fs.existsSync(candidate))
      if (!resolved) {
        throw new Error(`Cannot resolve ${request}`)
      }

      if (resolved.endsWith('.ts') || resolved.endsWith('.tsx')) {
        return loadTsModule(path.relative(projectRoot, resolved))
      }

      return require(resolved)
    }

    return require(request)
  }

  const wrapped = `(function (exports, require, module, __filename, __dirname) { ${transpiled}\n})`
  const script = new vm.Script(wrapped, { filename: filePath })
  const fn = script.runInThisContext()
  fn(module.exports, localRequire, module, filePath, dirname)
  return module.exports
}

test('upload slot transition reaches uploaded state and supports submission gate', () => {
  const uploadDomain = loadTsModule('lib/tutor-document-upload.ts')
  const {
    createInitialTutorDocumentSlots,
    transitionTutorDocumentSlot,
    canSubmitTutorDocuments,
    getTutorDocumentSubmissionUrls,
  } = uploadDomain

  const initial = createInitialTutorDocumentSlots()
  assert.equal(canSubmitTutorDocuments(initial), false)

  const studentUploaded = transitionTutorDocumentSlot(initial.studentIdCard, {
    type: 'uploadSucceeded',
    uploadedUrl: 'https://files.example/student.jpg',
    filePath: 'tutors/student-ids/student.jpg',
  })
  const idUploaded = transitionTutorDocumentSlot(initial.idCard, {
    type: 'uploadSucceeded',
    uploadedUrl: 'https://files.example/id.jpg',
    filePath: 'tutors/id-cards/id.jpg',
  })

  const slots = {
    studentIdCard: studentUploaded,
    idCard: idUploaded,
  }

  assert.equal(canSubmitTutorDocuments(slots), true)
  assert.deepEqual(getTutorDocumentSubmissionUrls(slots), {
    studentIdCardUrl: 'https://files.example/student.jpg',
    idCardUrl: 'https://files.example/id.jpg',
  })
})

test('upload failure transitions to failed state with retry count increment', () => {
  const uploadDomain = loadTsModule('lib/tutor-document-upload.ts')
  const { createInitialTutorDocumentSlots, transitionTutorDocumentSlot } = uploadDomain
  const initial = createInitialTutorDocumentSlots()

  const failed = transitionTutorDocumentSlot(initial.studentIdCard, {
    type: 'uploadFailed',
    error: '網路連線不穩定',
    errorCode: 'NETWORK_ERROR',
  })

  assert.equal(failed.state, 'failed')
  assert.equal(failed.retryCount, 1)
  assert.equal(failed.errorCode, 'NETWORK_ERROR')
  assert.equal(failed.uploadedUrl, '')
})

test('existing documents are treated as uploaded slots for resubmission', () => {
  const uploadDomain = loadTsModule('lib/tutor-document-upload.ts')
  const { createInitialTutorDocumentSlots, canSubmitTutorDocuments } = uploadDomain

  const slots = createInitialTutorDocumentSlots({
    studentIdCardUrl: 'https://files.example/old-student.jpg',
    idCardUrl: 'https://files.example/old-id.jpg',
  })

  assert.equal(slots.studentIdCard.state, 'uploaded')
  assert.equal(slots.idCard.state, 'uploaded')
  assert.equal(canSubmitTutorDocuments(slots), true)
})
