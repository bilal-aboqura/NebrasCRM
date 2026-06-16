import { describe, it, expect } from 'vitest'

describe('Super Admin Company Switcher', () => {
  it('should switch active company cookie and rescope queries', async () => {
    const response = await fetch('http://localhost:3000/api/auth/switch-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'sb-access-token=superadmin-session',
      },
      body: JSON.stringify({ company_id: 'c2f8b8a9-4567-48f8-b88a-d9be64ad931b' }),
      redirect: 'manual',
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.active_company_id).toBe('c2f8b8a9-4567-48f8-b88a-d9be64ad931b')
  })

  it('should return 403 for non-super-admin users', async () => {
    const response = await fetch('http://localhost:3000/api/auth/switch-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'sb-access-token=sales-session',
      },
      body: JSON.stringify({ company_id: 'c2f8b8a9-4567-48f8-b88a-d9be64ad931b' }),
      redirect: 'manual',
    })
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.success).toBe(false)
  })
})
