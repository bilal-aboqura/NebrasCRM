'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface GetPipelineFilters {
  assignedOwnerId?: string;
  city?: string;
  type?: string;
}

export interface PipelineCardData {
  id: string;
  nameAr: string;
  type: string;
  city: string;
  region: string;
  assignedOwnerId: string | null;
  assignedOwnerName: string | null;
  primaryPhone: string;
  primaryPhoneNormalized: string;
  whatsapp: string | null;
  statusChangedAt: string;
}

export interface ColumnPayload {
  stage: string;
  cards: PipelineCardData[];
  totalCount: number;
  hasMore: boolean;
}

export interface GetPipelineResponse {
  success: boolean;
  error?: string;
  data?: {
    columns: Record<string, ColumnPayload>;
  };
}

const STAGES = ['new', 'contacted', 'interested', 'offer', 'negotiation', 'contract', 'lost'] as const;
const PAGE_SIZE = 10;

export async function getPipelineAction(
  filters: GetPipelineFilters,
  pagination: Record<string, { page: number }>
): Promise<GetPipelineResponse> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'يرجى تسجيل الدخول' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'الملف الشخصي غير موجود' };

  const isSalesUser = profile.role === 'sales_user';
  const isManagement = ['super_admin', 'company_admin', 'supervisor'].includes(profile.role);

  const columns: Record<string, ColumnPayload> = {};

  for (const stage of STAGES) {
    const page = pagination[stage]?.page ?? 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('facilities')
      .select('*, assigned_to_profile:profiles!assigned_to(display_name), region:regions(name_ar), city:cities(name_ar)', { count: 'exact' })
      .eq('status', stage)
      .eq('company_id', profile.company_id)
      .eq('is_archived', false);

    if (isSalesUser) {
      query = query.eq('assigned_to', user.id);
    }

    if (filters.assignedOwnerId && isManagement) {
      query = query.eq('assigned_owner_id', filters.assignedOwnerId);
    }
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, count } = await query
      .order('status_changed_at', { ascending: false })
      .range(from, to);

    const cards: PipelineCardData[] = (data ?? []).map((f: any) => ({
      id: f.id,
      nameAr: f.name_ar,
      type: f.type,
      city: f.city?.name_ar ?? f.city_custom ?? '',
      region: f.region?.name_ar ?? '',
      assignedOwnerId: f.assigned_to,
      assignedOwnerName: f.assigned_to_profile?.display_name ?? null,
      primaryPhone: f.primary_phone,
      primaryPhoneNormalized: f.primary_phone_normalized,
      whatsapp: f.primary_phone_normalized,
      statusChangedAt: f.status_changed_at ?? f.updated_at,
    }));

    columns[stage] = {
      stage,
      cards,
      totalCount: count ?? 0,
      hasMore: (count ?? 0) > page * PAGE_SIZE,
    };
  }

  return { success: true, data: { columns } };
}

export async function updateFacilityStatusAction(params: {
  facilityId: string;
  newStatus: string;
  lostReason?: string;
  lostReasonNotes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'يرجى تسجيل الدخول' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'الملف الشخصي غير موجود' };

  const { data: facility } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', params.facilityId)
    .single();

  if (!facility) return { success: false, error: 'المنشأة غير موجودة' };
  if (facility.company_id !== profile.company_id) return { success: false, error: 'غير مصرح' };

  const isSalesUser = profile.role === 'sales_user';
  if (isSalesUser && facility.assigned_to !== user.id) {
    return { success: false, error: 'غير مصرح - المنشأة غير مسندة لك' };
  }

  if (params.newStatus === 'lost' && !params.lostReason) {
    return { success: false, error: 'يرجى تحديد سبب الاستبعاد' };
  }

  const oldStatus = facility.status;
  const oldReason = facility.lost_reason;

  const updateData: Record<string, unknown> = {
    status: params.newStatus,
  };

  if (params.newStatus === 'lost') {
    updateData.lost_reason = params.lostReason;
  } else if (oldStatus === 'lost' && params.newStatus !== 'lost') {
    updateData.lost_reason = null;
  }

  const { error: updateError } = await supabase
    .from('facilities')
    .update(updateData)
    .eq('id', params.facilityId);

  if (updateError) return { success: false, error: updateError.message };

  const { error: activityError } = await supabase
    .from('facility_activity')
    .insert({
      facility_id: params.facilityId,
      actor_id: user.id,
      event_type: 'status_change',
      old_value: oldStatus,
      new_value: params.newStatus === 'lost'
        ? `lost: ${params.lostReason}`
        : params.newStatus,
    });

  if (activityError) return { success: false, error: activityError.message };

  revalidatePath('/dashboard/pipeline');
  return { success: true };
}
