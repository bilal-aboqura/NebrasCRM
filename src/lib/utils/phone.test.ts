import { describe, it, expect } from 'vitest'
import { normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('normalizes Saudi mobile with leading 0', () => {
    expect(normalizePhone('0501234567')).toBe('966501234567')
  })

  it('normalizes Saudi landline with leading 0', () => {
    expect(normalizePhone('0114567890')).toBe('966114567890')
  })

  it('normalizes with +966 prefix', () => {
    expect(normalizePhone('+966501234567')).toBe('966501234567')
  })

  it('normalizes with 00 prefix', () => {
    expect(normalizePhone('00966501234567')).toBe('966501234567')
  })

  it('strips spaces and dashes', () => {
    expect(normalizePhone('+966 50 123 4567')).toBe('966501234567')
  })

  it('keeps already normalized number', () => {
    expect(normalizePhone('966501234567')).toBe('966501234567')
  })
})
