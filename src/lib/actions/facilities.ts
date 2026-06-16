'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/utils/phone'

// ============================================================
// Helpers
// ============================================================

async function getUserRole() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('غير مصرح')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id, id')
    .eq('id', user.id)
    .single()
  if (!profile) throw new Error('غير مصرح')
  return { user, profile }
}

function isManagement(role: string) {
  return ['super_admin', 'company_admin', 'supervisor'].includes(role)
}

// ============================================================
// T009: createFacility
// ============================================================

export async function createFacility(formData: FormData) {
  const { user, profile } = await getUserRole()
  const supabase = createClient()

  const nameAr = formData.get('name_ar') as string
  const type = formData.get('type') as string
  const regionId = formData.get('region_id') as string
  const cityId = formData.get('city_id') as string
  const cityCustom = formData.get('city_custom') as string
  const primaryPhone = formData.get('primary_phone') as string
  const secondaryPhone = formData.get('secondary_phone') as string
  const leadSource = formData.get('lead_source') as string || 'manual'
  const notes = formData.get('notes') as string
  const assignedTo = formData.get('assigned_to') as string

  const normalizedPhone = normalizePhone(primaryPhone)

  // Sales User: auto-assign to self
  let effectiveAssignedTo = assignedTo || null
  if (profile.role === 'sales_user') {
    effectiveAssignedTo = user.id
  }

  const { data, error } = await supabase
    .from('facilities')
    .insert({
      company_id: profile.company_id,
      name_ar: nameAr,
      type,
      region_id: regionId,
      city_id: cityId,
      city_custom: cityCustom || null,
      primary_phone: primaryPhone,
      primary_phone_normalized: normalizedPhone,
      secondary_phone: secondaryPhone || null,
      lead_source: leadSource,
      assigned_to: effectiveAssignedTo,
      notes: notes || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('رقم الهاتف مسجل بالفعل لمنشأة أخرى. يرجى التواصل مع المشرف الخاص بك للمساعدة.')
    }
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/facilities')
  return { success: true, data }
}

// ============================================================
// T013: getFacilitiesList
// ============================================================

export async function getFacilitiesList(formData?: FormData) {
  const { profile } = await getUserRole()
  const supabase = createClient()

  const page = formData ? parseInt(formData.get('page') as string) || 1 : 1
  const limit = formData ? parseInt(formData.get('limit') as string) || 15 : 15
  const search = formData?.get('search') as string || ''
  const status = formData?.get('status') as string || ''
  const regionId = formData?.get('region_id') as string || ''
  const cityId = formData?.get('city_id') as string || ''
  const showArchived = formData?.get('show_archived') === 'true'

  let query = supabase
    .from('facilities')
    .select('*, region:regions(name_ar), city:cities(name_ar)', { count: 'exact' })
    .eq('company_id', profile.company_id)

  // Sales User: only own assigned, never archived
  if (profile.role === 'sales_user') {
    query = query.eq('assigned_to', profile.id).eq('is_archived', false)
  } else {
    if (!showArchived) query = query.eq('is_archived', false)
  }

  if (search) {
    query = query.or(`name_ar.ilike.%${search}%,primary_phone.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)
  if (regionId) query = query.eq('region_id', regionId)
  if (cityId) query = query.eq('city_id', cityId)

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data: records, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    success: true,
    data: {
      records: records || [],
      meta: { total: count || 0, page, pages: Math.ceil((count || 0) / limit) },
    },
  }
}

// ============================================================
// T016: getFacilityDetail, getFacilityActivity
// ============================================================

export async function getFacilityDetail(id: string) {
  const { profile } = await getUserRole()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('facilities')
    .select('*, region:regions(name_ar), city:cities(name_ar), assigned_to_profile:profiles!assigned_to(display_name, email), created_by_profile:profiles!created_by(display_name, email), archived_by_profile:profiles!archived_by(display_name, email)')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (error) throw new Error('غير مصرح أو المنشأة غير موجودة.')
  return { success: true, data }
}

export async function getFacilityActivity(facilityId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('facility_activity')
    .select('*, actor:profiles(display_name, email)')
    .eq('facility_id', facilityId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return { success: true, data: data || [] }
}

// ============================================================
// T020: updateFacility
// ============================================================

export async function updateFacility(formData: FormData) {
  const { user, profile } = await getUserRole()
  const supabase = createClient()

  const id = formData.get('id') as string
  const nameAr = formData.get('name_ar') as string
  const type = formData.get('type') as string
  const regionId = formData.get('region_id') as string
  const cityId = formData.get('city_id') as string
  const cityCustom = formData.get('city_custom') as string
  const primaryPhone = formData.get('primary_phone') as string
  const secondaryPhone = formData.get('secondary_phone') as string
  const notes = formData.get('notes') as string
  const status = formData.get('status') as string
  const assignedTo = formData.get('assigned_to') as string

  const updates: Record<string, any> = {}
  if (nameAr) updates.name_ar = nameAr
  if (type) updates.type = type
  if (regionId) updates.region_id = regionId
  if (cityId) updates.city_id = cityId
  if (cityCustom !== undefined) updates.city_custom = cityCustom
  if (primaryPhone) {
    updates.primary_phone = primaryPhone
    updates.primary_phone_normalized = normalizePhone(primaryPhone)
  }
  if (secondaryPhone !== undefined) updates.secondary_phone = secondaryPhone || null
  if (notes !== undefined) updates.notes = notes
  if (status) {
    if (profile.role === 'sales_user') {
      updates.status = status
    } else {
      updates.status = status
    }
  }

  // Only management can reassign
  if (assignedTo && !isManagement(profile.role)) {
    throw new Error('غير مصرح لك بإجراء هذا التعديل.')
  }
  if (assignedTo) updates.assigned_to = assignedTo

  const { data, error } = await supabase
    .from('facilities')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('رقم الهاتف مسجل بالفعل لمنشأة أخرى.')
    }
    throw new Error(error.message)
  }

  revalidatePath(`/dashboard/facilities/${id}`)
  revalidatePath('/dashboard/facilities')
  return { success: true, data }
}

// ============================================================
// T023: archiveFacility, recoverFacility
// ============================================================

export async function archiveFacility(formData: FormData) {
  const { user, profile } = await getUserRole()
  if (!isManagement(profile.role)) {
    throw new Error('صلاحية الأرشفة والاستعادة مخصصة للمشرفين والمدراء فقط.')
  }

  const supabase = createClient()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('facilities')
    .update({ is_archived: true, archived_at: new Date().toISOString(), archived_by: user.id })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/facilities')
  return { success: true, is_archived: true }
}

export async function recoverFacility(formData: FormData) {
  const { profile } = await getUserRole()
  if (!isManagement(profile.role)) {
    throw new Error('صلاحية الأرشفة والاستعادة مخصصة للمشرفين والمدراء فقط.')
  }

  const supabase = createClient()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('facilities')
    .update({ is_archived: false, archived_at: null, archived_by: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/facilities')
  return { success: true, is_archived: false }
}

// ============================================================
// Get active users for assignment dropdown
// ============================================================

export async function getCompanyUsers() {
  const { profile } = await getUserRole()
  const supabase = createClient()

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, email, role')
    .eq('company_id', profile.company_id)
    .eq('status', 'active')

  return data || []
}
