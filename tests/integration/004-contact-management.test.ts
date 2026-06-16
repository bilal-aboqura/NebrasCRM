import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3000';

let authCookie: string | null = null;
let facilityId: string | null = null;

beforeAll(async () => {
  const loginRes = await fetch(`${BASE}/api/auth/callback?code=dummy`, {
    method: 'GET',
    redirect: 'manual',
  });
  const cookies = loginRes.headers.get('set-cookie') || '';
  authCookie = cookies.split(';')[0];

  // Create a facility for contact tests
  const createRes = await fetch(`${BASE}/dashboard/facilities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: authCookie || '',
    },
    body: JSON.stringify({
      name_ar: 'منشأة اختبار الاتصالات',
      region_id: 'reg-dummy',
      city_id: 'city-dummy',
      phone: '966501234567',
      whatsapp: '966501234567',
      status: 'active',
    }),
  });
  const data = await createRes.json();
  facilityId = data.id;
});

describe('004 - Contact Management', () => {
  it('creates a contact and sets it as primary', async () => {
    const res = await fetch(`${BASE}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie || '' },
      body: JSON.stringify({
        facility_id: facilityId,
        name_ar: 'أحمد محمد',
        job_title: 'مدير',
        primary_phone: '966551111111',
        email: 'ahmed@test.com',
      }),
    });
    expect(res.status).toBe(200);
    const contact = await res.json();
    expect(contact.name_ar).toBe('أحمد محمد');
    expect(contact.is_primary).toBe(true);
  });

  it('lists contacts for a facility', async () => {
    const res = await fetch(`${BASE}/api/contacts?facility_id=${facilityId}`, {
      headers: { Cookie: authCookie || '' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('archives a contact', async () => {
    const listRes = await fetch(`${BASE}/api/contacts?facility_id=${facilityId}`, {
      headers: { Cookie: authCookie || '' },
    });
    const contacts = await listRes.json();
    const contact = contacts[0];

    const res = await fetch(`${BASE}/api/contacts/${contact.id}/archive`, {
      method: 'PATCH',
      headers: { Cookie: authCookie || '' },
    });
    expect(res.status).toBe(200);
    const archived = await res.json();
    expect(archived.is_archived).toBe(true);
  });

  it('creates second contact as primary when first is archived', async () => {
    const res = await fetch(`${BASE}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie || '' },
      body: JSON.stringify({
        facility_id: facilityId,
        name_ar: 'سارة خالد',
        job_title: 'مسؤول',
        primary_phone: '966552222222',
      }),
    });
    expect(res.status).toBe(200);
    const contact = await res.json();
    expect(contact.is_primary).toBe(true);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await fetch(`${BASE}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facility_id: facilityId,
        name_ar: 'غير مصرح',
        job_title: 'مدخل',
        primary_phone: '966553333333',
      }),
    });
    expect(res.status).toBe(401);
  });
});
