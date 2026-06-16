import { describe, it, expect } from 'vitest'

describe('Invitation Flow', () => {
  it('should reject weak passwords', async () => {
    const response = await fetch('http://localhost:3000/api/auth/complete-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'test-token', password: 'short' }),
    })
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('should reject expired or invalid tokens', async () => {
    const response = await fetch('http://localhost:3000/api/auth/complete-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token', password: 'strongpassword123' }),
    })
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
  })
})
