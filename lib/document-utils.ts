import { createHash, randomBytes } from 'node:crypto'

export const DOCUMENT_REQUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const generateDocumentToken = () => randomBytes(24).toString('hex')

export const hashDocumentToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

export const getPhoneTail = (phoneNumber: string) =>
  phoneNumber.replace(/\D/g, '').slice(-3)

export const createDocumentExpiryIso = () =>
  new Date(Date.now() + DOCUMENT_REQUEST_TTL_MS).toISOString()

export const isDocumentRequestExpired = (expiresAt?: string | null) =>
  !expiresAt || new Date(expiresAt).getTime() < Date.now()
