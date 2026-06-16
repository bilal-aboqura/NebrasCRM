import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3000';
let authCookie: string | null = null;

beforeAll(async () => {
  const loginRes = await fetch(`${BASE}/api/auth/callback?code=dummy`, {
    method: 'GET',
    redirect: 'manual',
  });
  const cookies = loginRes.headers.get('set-cookie') || '';
  authCookie = cookies.split(';')[0];
});

describe('006 - Follow-up Management', () => {
  it('rejects unauthenticated createFollowUp', async () => {
    const res = await fetch(`${BASE}/api/followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facility_id: 'none', type: 'call', due_at: new Date().toISOString() }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects create with past due date', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const res = await fetch(`${BASE}/api/followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie || '' },
      body: JSON.stringify({
        facility_id: '00000000-0000-0000-0000-000000000001',
        type: 'call',
        due_at: past.toISOString(),
      }),
    });
    const data = await res.json();
    expect(data.error).toContain('المستقبل');
  });

  it('lists followups and returns records', async () => {
    const res = await fetch(`${BASE}/api/followups`, {
      headers: { Cookie: authCookie || '' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data?.records)).toBe(true);
  });

  it('rejects reassign for non-management users', async () => {
    const res = await fetch(`${BASE}/api/followups/some-id/reassign`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer sales_user' },
    });
    expect(res.status).toBe(403);
  });
});
