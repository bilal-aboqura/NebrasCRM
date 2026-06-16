'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { normalizePhone } from '@/lib/utils/phone';

export type ContactFormData = {
  name_ar: string;
  job_title: string;
  primary_phone: string;
  secondary_phone?: string;
  email?: string;
  notes?: string;
};

export type ContactRecord = {
  id: string;
  facility_id: string;
  name_ar: string;
  job_title: string;
  primary_phone: string;
  primary_phone_normalized: string;
  secondary_phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export async function createContact(facilityId: string, data: ContactFormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const profileId = user.id;
  const primaryNormalized = normalizePhone(data.primary_phone);
  const secondaryNormalized = data.secondary_phone ? normalizePhone(data.secondary_phone) : null;

  const { data: facility } = await supabase
    .from('facilities')
    .select('company_id')
    .eq('id', facilityId)
    .single();

  if (!facility) throw new Error('Facility not found');

  const { data: existingPrimary } = await supabase
    .from('contacts')
    .select('id')
    .eq('facility_id', facilityId)
    .eq('is_primary', true)
    .eq('is_archived', false)
    .maybeSingle();

  const isPrimary = !existingPrimary;

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      company_id: facility.company_id,
      facility_id: facilityId,
      name_ar: data.name_ar,
      job_title: data.job_title,
      primary_phone: data.primary_phone,
      primary_phone_normalized: primaryNormalized,
      secondary_phone: secondaryNormalized,
      email: data.email || null,
      is_primary: isPrimary,
      notes: data.notes || null,
      created_by: profileId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/facilities/${facilityId}`);
  return contact;
}

export async function updateContact(contactId: string, data: ContactFormData & { is_primary?: boolean }) {
  const supabase = await createClient();
  const normalized = normalizePhone(data.primary_phone);

  const updates: Record<string, unknown> = {
    name_ar: data.name_ar,
    job_title: data.job_title,
    primary_phone: data.primary_phone,
    primary_phone_normalized: normalized,
    secondary_phone: data.secondary_phone ? normalizePhone(data.secondary_phone) : null,
    email: data.email || null,
    notes: data.notes || null,
  };

  if (data.is_primary !== undefined) {
    updates.is_primary = data.is_primary;
  }

  const { data: contact } = await supabase
    .from('contacts')
    .select('facility_id')
    .eq('id', contactId)
    .single();

  if (!contact) throw new Error('Contact not found');

  const { data: updated, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/facilities/${contact.facility_id}`);
  return updated;
}

export async function listContacts(facilityId: string, includeArchived = false) {
  const supabase = await createClient();

  let query = supabase
    .from('contacts')
    .select('*')
    .eq('facility_id', facilityId)
    .order('created_at', { ascending: true });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data as unknown as ContactRecord[];
}

export async function archiveContact(contactId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: contact, error } = await supabase
    .from('contacts')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: user.id,
      is_primary: false,
    })
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/facilities/${contact.facility_id}`);
  return contact;
}

export async function setPrimaryContact(contactId: string, facilityId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Atomic swap: unset all, then set one
  const { error: unsetError } = await supabase
    .from('contacts')
    .update({ is_primary: false })
    .eq('facility_id', facilityId)
    .eq('is_archived', false);

  if (unsetError) throw new Error(unsetError.message);

  const { data: contact, error } = await supabase
    .from('contacts')
    .update({ is_primary: true })
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/facilities/${facilityId}`);
  return contact;
}
