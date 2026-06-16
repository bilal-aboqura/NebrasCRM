'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type CommunicationChannel = 'call' | 'whatsapp';
export type CommunicationDirection = 'inbound' | 'outbound';
export type CommunicationOutcome =
  | 'answered' | 'no_answer' | 'busy' | 'wrong_number'
  | 'callback_requested' | 'not_reachable';

export interface CreateCallLogInput {
  facilityId: string;
  contactId?: string;
  followupId?: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  occurredAt?: string;
  outcome: CommunicationOutcome;
  durationSeconds?: number;
  notes?: string;
  completeFollowUp?: boolean;
}

export interface UpdateCallLogInput {
  outcome: CommunicationOutcome;
  durationSeconds?: number;
  notes?: string;
}

export interface CallLogRecord {
  id: string;
  company_id: string;
  facility_id: string;
  contact_id: string | null;
  followup_id: string | null;
  created_by_id: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  occurred_at: string;
  outcome: CommunicationOutcome;
  duration_seconds: number | null;
  notes: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by_id: string | null;
  created_at: string;
  updated_at: string;
  last_edited_by_id: string | null;
  last_edited_at: string | null;
  contact_name?: string;
}

export async function createCallLog(input: CreateCallLogInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'يرجى تسجيل الدخول' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false as const, error: 'الملف الشخصي غير موجود' };

  const { data: facility } = await supabase
    .from('facilities')
    .select('company_id, assigned_to, is_archived')
    .eq('id', input.facilityId)
    .single();

  if (!facility || facility.company_id !== profile.company_id) {
    return { success: false as const, error: 'المنشأة غير موجودة' };
  }

  if (facility.is_archived) return { success: false as const, error: 'لا يمكن تسجيل اتصال لمنشأة مؤرشفة' };

  const isSalesUser = profile.role === 'sales_user';
  if (isSalesUser && facility.assigned_to !== user.id) {
    return { success: false as const, error: 'غير مصرح - المنشأة غير مسندة لك' };
  }

  if (input.contactId) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', input.contactId)
      .eq('facility_id', input.facilityId)
      .maybeSingle();
    if (!contact) return { success: false as const, error: 'جهة الاتصال المحددة لا تنتمي إلى هذه المنشأة' };
  }

  if (input.followupId) {
    const { data: followup } = await supabase
      .from('followups')
      .select('id, status, facility_id, company_id')
      .eq('id', input.followupId)
      .single();
    if (!followup || followup.facility_id !== input.facilityId || followup.company_id !== profile.company_id) {
      return { success: false as const, error: 'المتابعة المحددة لا تنتمي إلى هذه المنشأة' };
    }
    if (followup.status !== 'pending') return { success: false as const, error: 'يمكن ربط المتابعات المعلقة فقط' };
  }

  const occurredAt = input.occurredAt || new Date().toISOString();
  if (new Date(occurredAt) > new Date(Date.now() + 60000)) {
    return { success: false as const, error: 'تاريخ الاتصال لا يمكن أن يكون في المستقبل' };
  }

  const { data: callLog, error: insertError } = await supabase
    .from('call_logs')
    .insert({
      company_id: profile.company_id,
      facility_id: input.facilityId,
      contact_id: input.contactId || null,
      followup_id: input.followupId || null,
      created_by_id: user.id,
      channel: input.channel,
      direction: input.direction,
      occurred_at: occurredAt,
      outcome: input.outcome,
      duration_seconds: input.durationSeconds || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (insertError) return { success: false as const, error: insertError.message };

  const channelLabel = input.channel === 'call' ? 'اتصال' : 'واتساب';
  const directionLabel = input.direction === 'outbound' ? 'صادر' : 'وارد';
  const outcomeLabels: Record<string, string> = {
    answered: 'تم الرد', no_answer: 'لم يرد', busy: 'مشغول',
    wrong_number: 'رقم خاطئ', callback_requested: 'طلب إعادة اتصال', not_reachable: 'غير متاح',
  };

  await supabase.from('facility_activity').insert({
    company_id: profile.company_id,
    facility_id: input.facilityId,
    actor_id: user.id,
    event_type: 'call_logged',
    new_value: `تم تسجيل ${channelLabel} ${directionLabel} (${outcomeLabels[input.outcome] || input.outcome})`,
  });

  if (input.completeFollowUp && input.followupId) {
    await supabase
      .from('followups')
      .update({ status: 'done', completed_by: user.id, completed_at: new Date().toISOString() })
      .eq('id', input.followupId);

    await supabase.from('facility_activity').insert({
      company_id: profile.company_id,
      facility_id: input.facilityId,
      actor_id: user.id,
      event_type: 'followup_complete',
      new_value: 'تم إتمام المتابعة المرتبطة بالاتصال',
    });
  }

  revalidatePath(`/dashboard/facilities/${input.facilityId}`);
  return { success: true as const, data: callLog };
}

export async function updateCallLog(id: string, input: UpdateCallLogInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'يرجى تسجيل الدخول' };

  const { data: log } = await supabase
    .from('call_logs')
    .select('*, facility:facilities(company_id, assigned_to, is_archived)')
    .eq('id', id)
    .single();

  if (!log) return { success: false as const, error: 'السجل غير موجود' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.company_id !== (log.facility as any).company_id) {
    return { success: false as const, error: 'غير مصرح' };
  }

  if (profile.role === 'sales_user') {
    const hoursSinceCreation = (Date.now() - new Date(log.created_at).getTime()) / 3600000;
    if (hoursSinceCreation > 24) {
      return { success: false as const, error: 'لا يمكن تعديل السجل بعد مرور 24 ساعة من إنشائه' };
    }
    if (log.created_by_id !== user.id) {
      return { success: false as const, error: 'يمكن للمنشئ فقط تعديل السجل' };
    }
  }

  const { data: updated, error } = await supabase
    .from('call_logs')
    .update({
      outcome: input.outcome,
      duration_seconds: input.durationSeconds || null,
      notes: input.notes !== undefined ? input.notes : undefined,
      last_edited_by_id: user.id,
      last_edited_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false as const, error: error.message };

  await supabase.from('facility_activity').insert({
    company_id: profile.company_id,
    facility_id: log.facility_id,
    actor_id: user.id,
    event_type: 'call_log_edited',
    new_value: 'تم تعديل سجل الاتصال',
  });

  revalidatePath(`/dashboard/facilities/${log.facility_id}`);
  return { success: true as const, data: updated };
}

export async function archiveCallLog(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'يرجى تسجيل الدخول' };

  const { data: log } = await supabase
    .from('call_logs')
    .select('*, facility:facilities(company_id)')
    .eq('id', id)
    .single();

  if (!log) return { success: false as const, error: 'السجل غير موجود' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.company_id !== (log.facility as any).company_id) {
    return { success: false as const, error: 'غير مصرح' };
  }

  const { error } = await supabase
    .from('call_logs')
    .update({ is_archived: true, archived_at: new Date().toISOString(), archived_by_id: user.id })
    .eq('id', id);

  if (error) return { success: false as const, error: error.message };

  await supabase.from('facility_activity').insert({
    company_id: profile.company_id,
    facility_id: log.facility_id,
    actor_id: user.id,
    event_type: 'call_log_archived',
    new_value: 'تم أرشفة سجل الاتصال',
  });

  revalidatePath(`/dashboard/facilities/${log.facility_id}`);
  return { success: true as const };
}

export async function recoverCallLog(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'يرجى تسجيل الدخول' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'company_admin', 'supervisor'].includes(profile.role)) {
    return { success: false as const, error: 'استعادة سجلات الاتصال متاحة فقط للمشرفين والمدراء' };
  }

  const { data: log } = await supabase
    .from('call_logs')
    .select('*, facility:facilities(company_id)')
    .eq('id', id)
    .single();

  if (!log || (log.facility as any).company_id !== profile.company_id) {
    return { success: false as const, error: 'السجل غير موجود' };
  }

  const { error } = await supabase
    .from('call_logs')
    .update({ is_archived: false, archived_at: null, archived_by_id: null })
    .eq('id', id);

  if (error) return { success: false as const, error: error.message };

  await supabase.from('facility_activity').insert({
    company_id: profile.company_id,
    facility_id: log.facility_id,
    actor_id: user.id,
    event_type: 'call_log_recovered',
    new_value: 'تم استعادة سجل الاتصال',
  });

  revalidatePath(`/dashboard/facilities/${log.facility_id}`);
  return { success: true as const };
}

export async function getCallLogs(facilityId: string, includeArchived = false) {
  const supabase = await createClient();

  let query = supabase
    .from('call_logs')
    .select('*, contact:contacts(name_ar)')
    .eq('facility_id', facilityId)
    .order('occurred_at', { ascending: false });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  if (error) return { success: false as const, error: error.message };

  const records: CallLogRecord[] = (data ?? []).map((l: any) => ({
    ...l,
    contact_name: l.contact?.name_ar ?? null,
  }));

  return { success: true as const, data: records };
}
