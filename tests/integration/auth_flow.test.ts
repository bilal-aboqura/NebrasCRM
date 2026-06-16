import { describe, it, expect } from 'vitest'

describe('Auth Flow', () => {
  it('should redirect to dashboard on successful login', async () => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin_a@nebrasgoo.com', password: 'password123' }),
      redirect: 'manual',
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('admin_a@nebrasgoo.com')
  })

  it('should return 401 on invalid credentials', async () => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wrong@example.com', password: 'wrong' }),
      redirect: 'manual',
    })
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.success).toBe(false)
  })
})
