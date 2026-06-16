import { describe, it, expect } from 'vitest'

describe('Facilities', () => {
  it('should reject creating facility with duplicate phone', async () => {
    const form = new FormData()
    form.set('name_ar', 'Test Facility')
    form.set('type', 'medical_complex')
    form.set('region_id', 'r1000000-0000-0000-0000-000000000001')
    form.set('city_id', 'c1000000-0000-0000-0000-000000000001')
    form.set('primary_phone', '0501234567')

    const res = await fetch('http://localhost:3000/api/facilities/create', { method: 'POST', body: form })
    const data = await res.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('رقم الهاتف')
  })

  it('should reject search from unauthenticated user', async () => {
    const res = await fetch('http://localhost:3000/api/facilities?search=test')
    expect(res.status).toBe(401)
  })

  it('should reject archive by sales user', async () => {
    const form = new FormData()
    form.set('id', 'test-id')
    const res = await fetch('http://localhost:3000/api/facilities/archive', {
      method: 'POST',
      body: form,
      headers: { Cookie: 'sb-access-token=sales-session' },
    })
    const data = await res.json()
    expect(data.error || data.success === false).toBeTruthy()
  })

  it('should reject weak password in profile', async () => {
    const res = await fetch('http://localhost:3000/api/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: 'old', new_password: 'short' }),
    })
    expect(res.status).toBe(401)
  })
})
