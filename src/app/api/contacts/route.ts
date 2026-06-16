import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/utils/phone';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const facilityId = request.nextUrl.searchParams.get('facility_id');
  if (!facilityId) return NextResponse.json({ error: 'facility_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('facility_id', facilityId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { facility_id, name_ar, job_title, primary_phone, secondary_phone, email, notes } = body;

  if (!facility_id || !name_ar || !job_title || !primary_phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: facility } = await supabase
    .from('facilities')
    .select('company_id')
    .eq('id', facility_id)
    .single();

  if (!facility) return NextResponse.json({ error: 'Facility not found' }, { status: 404 });

  const { data: existingPrimary } = await supabase
    .from('contacts')
    .select('id')
    .eq('facility_id', facility_id)
    .eq('is_primary', true)
    .eq('is_archived', false)
    .maybeSingle();

  const isPrimary = !existingPrimary;

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      company_id: facility.company_id,
      facility_id,
      name_ar,
      job_title,
      primary_phone,
      primary_phone_normalized: normalizePhone(primary_phone),
      secondary_phone: secondary_phone ? normalizePhone(secondary_phone) : null,
      email: email || null,
      is_primary: isPrimary,
      notes: notes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
