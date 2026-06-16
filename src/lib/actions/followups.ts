'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { validateFutureDate, type CreateFollowUpInput, type CompleteFollowUpInput, type GetFollowUpsInput, type FollowUpRecord } from '@/lib/types/followups';

export async function createFollowUp(data: CreateFollowUpInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'يرجى تسجيل الدخول' };

  if (!data.facility_id || !data.type || !data.due_at) {
    return { success: false as const, error: 'جميع الحقول المطلوبة يجب أن تكون موجودة' };
  }
  const dateErr = validateFutureDate(data.due_at);
  if (dateErr) return { success: false as const, error: dateErr };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false as const, error: 'الملف الشخصي غير موجود' };

  const { data: facility } = await supabase
    .from('facilities')
    .select('company_id, assigned_to')
    .eq('id', data.facility_id)
    .single();

  if (!facility || facility.company_id !== profile.company_id) {
    return { success: false as const, error: 'المنشأة غير موجودة' };
  }

  const isSalesUser = profile.role === 'sales_user';
  if (isSalesUser && facility.assigned_to !== user.id) {
    return { success: false as const, error: 'غير مصرح - المنشأة غير مسندة لك' };
  }

  if (data.contact_id) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', data.contact_id)
      .eq('facility_id', data.facility_id)
      .maybeSingle();

    if (!contact) return { success: false as const, error: 'جهة الاتصال المحددة لا تنتمي إلى هذه المنشأة' };
  }

  const assignedTo = data.assigned_to || facility.assigned_to || user.id;

  const { data: result, error } = await supabase
    .from('followups')
    .insert({
      company_id: profile.company_id,
      facility_id: data.facility_id,
      contact_id: data.contact_id || null,
      assigned_to: assignedTo,
      type: data.type,
      due_at: data.due_at,
      notes: data.notes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { success: false as const, error: error.message };

  await supabase.from('facility_activity').insert({
    facility_id: data.facility_id,
    actor_id: user.id,
    event_type: 'followup_create',
    new_value: `تم إنشاء متابعة: ${data.type}`,
  });

  revalidatePath(`/dashboard/facilities/${data.facility_id}`);
  revalidatePath('/dashboard/followups');
  return { success: true as const, data: result };
}

export async function completeFollowUp(id: string, input: CompleteFollowUpInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'يرجى تسجيل الدخول' };

  const { data: followup, error: fetchError } = await supabase
    .from('followups')
    .select('facility_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !followup) return { success: false as const, error: 'المتابعة غير موجودة' };
  if (followup.status !== 'pending') return { success: false as const, error: 'يمكن إتمام المتابعات المعلقة فقط' };

  const { data: result, error } = await supabase
    .from('followups')
    .update({
      status: 'done',
      outcome: input.outcome || null,
      outcome_note: input.outcome_note || null,
      completed_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false as const, error: error.message };

  await supabase.from('facility_activity').insert({
    facility_id: followup.facility_id,
    actor_id: user.id,
    event_type: 'followup_complete',
    new_value: `تم إتمام المتابعة${input.outcome ? ` (${input.outcome})` : ''}`,
  });

  revalidatePath(`/dashboard/facilities/${followup.facility_id}`);
  revalidatePath('/dashboard/followups');
  return { success: true as const, data: result };
}

export async function rescheduleFollowUp(id: string, due_at: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'يرجى تسجيل الدخول' };

  if (new Date(due_at) <= new Date()) {
    return { success: false as const, error: 'تاريخ الاستحقاق يجب أن يكون في المستقبل' };
  }

  const { data: followup, error: fetchError } = await supabase
    .from('followups')
    .select('facility_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !followup) return { success: false as const, error: 'المتابعة غير موجودة' };
  if (followup.status !== 'pending') return { success: false as const, error: 'يمكن إعادة جدولة المتابعات المعلقة فقط' };

  const { data: result, error } = await supabase
    .from('followups')
    .update({ due_at })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false as const, error: error.message };

  await supabase.from('facility_activity').insert({
    facility_id: followup.facility_id,
    actor_id: user.id,
    event_type: 'followup_reschedule',
    new_value: `تم إعادة جدولة المتابعة إلى ${new Date(due_at).toLocaleDateString('ar-SA')}`,
  });

  revalidatePath(`/dashboard/facilities/${followup.facility_id}`);
  revalidatePath('/dashboard/followups');
  return { success: true as const, data: result };
}

export async function cancelFollowUp(id: string, cancel_reason?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'يرجى تسجيل الدخول' };

  const { data: followup, error: fetchError } = await supabase
    .from('followups')
    .select('facility_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !followup) return { success: false as const, error: 'المتابعة غير موجودة' };
  if (followup.status !== 'pending') return { success: false as const, error: 'يمكن إلغاء المتابعات المعلقة فقط' };

  const { data: result, error } = await supabase
    .from('followups')
    .update({
      status: 'cancelled',
      cancel_reason: cancel_reason || null,
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false as const, error: error.message };

  await supabase.from('facility_activity').insert({
    facility_id: followup.facility_id,
    actor_id: user.id,
    event_type: 'followup_cancel',
    new_value: `تم إلغاء المتابعة${cancel_reason ? ` (${cancel_reason})` : ''}`,
  });

  revalidatePath(`/dashboard/facilities/${followup.facility_id}`);
  revalidatePath('/dashboard/followups');
  return { success: true as const, data: result };
}

export async function reassignFollowUp(id: string, assigned_to: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'يرجى تسجيل الدخول' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'company_admin', 'supervisor'].includes(profile.role)) {
    return { success: false as const, error: 'تعديل المسؤول المعين متاح فقط للمشرفين والمدراء' };
  }

  const { data: followup, error: fetchError } = await supabase
    .from('followups')
    .select('facility_id, company_id')
    .eq('id', id)
    .single();

  if (fetchError || !followup) return { success: false as const, error: 'المتابعة غير موجودة' };
  if (followup.company_id !== profile.company_id) return { success: false as const, error: 'غير مصرح' };

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', assigned_to)
    .eq('company_id', profile.company_id)
    .single();

  if (!targetProfile) return { success: false as const, error: 'المستخدم المستهدف غير موجود في الشركة' };

  const { data: result, error } = await supabase
    .from('followups')
    .update({ assigned_to })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false as const, error: error.message };

  await supabase.from('facility_activity').insert({
    facility_id: followup.facility_id,
    actor_id: user.id,
    event_type: 'followup_reassign',
    new_value: `تم إسناد المتابعة إلى مستخدم آخر`,
  });

  revalidatePath(`/dashboard/facilities/${followup.facility_id}`);
  revalidatePath('/dashboard/followups');
  return { success: true as const, data: result };
}

export async function getFollowUpsList(params: GetFollowUpsInput = {}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'يرجى تسجيل الدخول' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false as const, error: 'الملف الشخصي غير موجود' };

  const isManagement = ['super_admin', 'company_admin', 'supervisor'].includes(profile.role);
  const limit = params.limit || 50;
  const page = params.page || 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('followups')
    .select('*, facility:facilities!inner(name_ar, is_archived), assigned:profiles!assigned_to(display_name)', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .eq('facility.is_archived', false);

  if (!isManagement) {
    query = query.eq('assigned_to', user.id);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.assigned_to && isManagement) {
    query = query.eq('assigned_to', params.assigned_to);
  }

  if (!params.status) {
    query = query.in('status', ['pending', 'done', 'cancelled']);
  }

  query = query.order('status', { ascending: true })
    .order('due_at', { ascending: true });

  const { data, error, count } = await query.range(from, to);

  if (error) return { success: false as const, error: error.message };

  const records: FollowUpRecord[] = (data ?? []).map((f: any) => ({
    ...f,
    facility_name: f.facility?.name_ar ?? '',
    assigned_name: f.assigned?.display_name ?? null,
  }));

  const total = count ?? 0;

  return {
    success: true as const,
    data: {
      records,
      meta: { total, page, pages: Math.ceil(total / limit) },
    },
  };
}
