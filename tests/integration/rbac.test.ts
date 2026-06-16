import { describe, it, expect } from 'vitest'

describe('RBAC', () => {
  it('should allow admin to access admin routes', async () => {
    const response = await fetch('http://localhost:3000/admin', {
      headers: { Cookie: 'sb-access-token=admin-session' },
      redirect: 'manual',
    })
    expect(response.status).toBe(200)
  })

  it('should deny sales user from accessing admin routes', async () => {
    const response = await fetch('http://localhost:3000/admin', {
      headers: { Cookie: 'sb-access-token=sales-session' },
      redirect: 'manual',
    })
    expect(response.status).toBe(403)
  })
})
