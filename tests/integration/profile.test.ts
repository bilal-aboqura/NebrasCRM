import { describe, it, expect } from 'vitest'

describe('Profile', () => {
  it('should reject unauthenticated profile name update', async () => {
    const response = await fetch('http://localhost:3000/api/profile/update-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: 'New Name' }),
    })
    expect(response.status).toBe(401)
  })

  it('should reject weak password changes', async () => {
    const response = await fetch('http://localhost:3000/api/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: 'oldpass', new_password: 'short' }),
    })
    expect(response.status).toBe(400)
  })
})
