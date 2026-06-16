import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/utils/phone';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name_ar) updates.name_ar = body.name_ar;
  if (body.job_title) updates.job_title = body.job_title;
  if (body.primary_phone) {
    updates.primary_phone = body.primary_phone;
    updates.primary_phone_normalized = normalizePhone(body.primary_phone);
  }
  if (body.secondary_phone !== undefined) {
    updates.secondary_phone = body.secondary_phone ? normalizePhone(body.secondary_phone) : null;
  }
  if (body.email !== undefined) updates.email = body.email || null;
  if (body.is_primary !== undefined) updates.is_primary = body.is_primary;
  if (body.notes !== undefined) updates.notes = body.notes || null;

  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
