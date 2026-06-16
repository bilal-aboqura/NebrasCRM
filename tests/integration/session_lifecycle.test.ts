import { describe, it, expect } from 'vitest'

describe('Session Lifecycle', () => {
  it('should clear cookies and redirect to login on logout', async () => {
    const response = await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: 'sb-access-token=test-session; sb-refresh-token=test-refresh' },
      redirect: 'manual',
    })
    expect(response.status).toBe(302)
    const location = response.headers.get('location')
    expect(location).toBe('/login')
  })

  it('should redirect unauthenticated user to login', async () => {
    const response = await fetch('http://localhost:3000/', { redirect: 'manual' })
    expect(response.status).toBe(302)
    const location = response.headers.get('location')
    expect(location).toBe('/login')
  })
})
