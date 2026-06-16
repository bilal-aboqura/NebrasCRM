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

describe('007 - Call Logging', () => {
  it('rejects unauthenticated createCallLog', async () => {
    const res = await fetch(`${BASE}/api/call-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId: 'none', channel: 'call', direction: 'outbound', outcome: 'answered' }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects future occurred_at', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const res = await fetch(`${BASE}/api/call-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie || '' },
      body: JSON.stringify({
        facilityId: '00000000-0000-0000-0000-000000000001',
        channel: 'call',
        direction: 'outbound',
        outcome: 'answered',
        occurredAt: future.toISOString(),
      }),
    });
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('lists call logs for a facility', async () => {
    const res = await fetch(`${BASE}/api/call-logs?facilityId=dummy`, {
      headers: { Cookie: authCookie || '' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('rejects archive by non-management users', async () => {
    const res = await fetch(`${BASE}/api/call-logs/some-id/archive`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer sales_user' },
    });
    expect(res.status).toBe(403);
  });
});
