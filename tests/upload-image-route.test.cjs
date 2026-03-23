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
    if (request in mocks) {
      return mocks[request]
    }

    if (request.startsWith('.') || request.startsWith('@/')) {
      const basePath = request.startsWith('@/')
        ? path.join(projectRoot, request.slice(2))
        : path.resolve(dirname, request)
      const candidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, path.join(basePath, 'index.ts')]
      const resolvedPath = candidates.find((candidate) => fs.existsSync(candidate))
      if (!resolvedPath) {
        throw new Error(`Cannot resolve ${request}`)
      }

      if (resolvedPath.endsWith('.ts') || resolvedPath.endsWith('.tsx')) {
        return loadTsModule(path.relative(projectRoot, resolvedPath), mocks)
      }

      return require(resolvedPath)
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
  NextResponse: class NextResponse {
    constructor(body, init = {}) {
      this.status = init.status ?? 200
      this.body = body
      this.headers = init.headers || {}
    }

    static json(body, init = {}) {
      return {
        status: init.status ?? 200,
        body,
      }
    }
  },
})

const createMockRequest = (payload) => ({
  formData: async () => ({
    get: (key) => payload[key] ?? null,
  }),
})

const createMockFile = ({ name = 'image.jpg', type = 'image/jpeg', size = 1024 } = {}) => ({
  name,
  type,
  size,
  arrayBuffer: async () => Buffer.from('test-image').buffer,
})

test('upload-image route rejects missing params', async () => {
  const { POST } = loadTsModule('app/api/upload-image/route.ts', {
    'next/server': createNextServerMock(),
    '@/lib/firebase/firebase-admin': {
      adminStorage: {},
    },
    '@/lib/imageUtils.server': {
      addWatermark: async () => Buffer.from('watermarked'),
    },
  })

  const response = await POST(createMockRequest({ folder: 'tutors' }))
  assert.equal(response.status, 400)
  assert.equal(response.body.errorCode, 'MISSING_PARAMS')
})

test('upload-image route rejects invalid upload target and mime type', async () => {
  const { POST } = loadTsModule('app/api/upload-image/route.ts', {
    'next/server': createNextServerMock(),
    '@/lib/firebase/firebase-admin': {
      adminStorage: {},
    },
    '@/lib/imageUtils.server': {
      addWatermark: async () => Buffer.from('watermarked'),
    },
  })

  const invalidTargetResponse = await POST(
    createMockRequest({
      file: createMockFile(),
      folder: 'invalid-folder',
      subfolder: 'id-cards',
    })
  )
  assert.equal(invalidTargetResponse.status, 400)
  assert.equal(invalidTargetResponse.body.errorCode, 'INVALID_UPLOAD_TARGET')

  const invalidFileTypeResponse = await POST(
    createMockRequest({
      file: createMockFile({ type: 'text/plain' }),
      folder: 'tutors',
      subfolder: 'id-cards',
    })
  )
  assert.equal(invalidFileTypeResponse.status, 400)
  assert.equal(invalidFileTypeResponse.body.errorCode, 'INVALID_FILE_TYPE')
})

test('upload-image route returns success response with url and filePath', async () => {
  let savedPayload = null

  const { POST } = loadTsModule('app/api/upload-image/route.ts', {
    'next/server': createNextServerMock(),
    '@/lib/firebase/firebase-admin': {
      adminStorage: {
        bucket: () => ({
          file: (filePath) => ({
            save: async (buffer, options) => {
              savedPayload = {
                filePath,
                bufferSize: buffer.length,
                contentType: options.metadata.contentType,
              }
            },
            getSignedUrl: async () => ['https://files.example/uploaded.jpg'],
          }),
        }),
      },
    },
    '@/lib/imageUtils.server': {
      addWatermark: async (buffer) => buffer,
    },
  })

  const response = await POST(
    createMockRequest({
      file: createMockFile(),
      folder: 'tutors',
      subfolder: 'student-ids',
    })
  )

  assert.equal(response.status, 200)
  assert.equal(response.body.success, true)
  assert.equal(response.body.url, 'https://files.example/uploaded.jpg')
  assert.equal(response.body.filePath.startsWith('tutors/student-ids/'), true)
  assert.equal(savedPayload.contentType, 'image/jpeg')
  assert.equal(savedPayload.bufferSize > 0, true)
})
