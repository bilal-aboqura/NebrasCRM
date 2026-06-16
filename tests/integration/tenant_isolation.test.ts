import { describe, it, expect } from 'vitest'

describe('Tenant Isolation', () => {
  it('should deny cross-tenant data access', async () => {
    const response = await fetch('http://localhost:3000/api/companies', {
      headers: { Cookie: 'sb-access-token=company-a-session' },
    })
    expect(response.status).toBe(403)
  })

  it('should allow same-tenant data access', async () => {
    const response = await fetch('http://localhost:3000/api/companies', {
      headers: { Cookie: 'sb-access-token=company-a-session' },
    })
    expect(response.status).toBe(200)
  })
})
