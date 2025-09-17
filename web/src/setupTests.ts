import '@testing-library/jest-dom/vitest'
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto = webcrypto as unknown as Crypto
}

beforeEach(() => {
  window.localStorage.clear()
})

