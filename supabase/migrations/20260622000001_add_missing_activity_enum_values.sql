-- Add missing facility_activity_type enum values that were defined in
-- migrations 004, 008, 009 but never applied to the remote DB.
do $$ begin
  alter type public.facility_activity_type add value if not exists 'contact_added';
  alter type public.facility_activity_type add value if not exists 'contact_edited';
  alter type public.facility_activity_type add value if not exists 'contact_archived';
  alter type public.facility_activity_type add value if not exists 'contact_recovered';
  alter type public.facility_activity_type add value if not exists 'offer_created';
  alter type public.facility_activity_type add value if not exists 'offer_sent';
  alter type public.facility_activity_type add value if not exists 'offer_revised';
  alter type public.facility_activity_type add value if not exists 'offer_accepted';
  alter type public.facility_activity_type add value if not exists 'offer_rejected';
  alter type public.facility_activity_type add value if not exists 'offer_archived';
  alter type public.facility_activity_type add value if not exists 'offer_recovered';
  alter type public.facility_activity_type add value if not exists 'contract_created';
  alter type public.facility_activity_type add value if not exists 'contract_updated';
  alter type public.facility_activity_type add value if not exists 'contract_activated';
  alter type public.facility_activity_type add value if not exists 'contract_completed';
  alter type public.facility_activity_type add value if not exists 'contract_terminated';
  alter type public.facility_activity_type add value if not exists 'contract_addended';
  alter type public.facility_activity_type add value if not exists 'contract_document_uploaded';
  alter type public.facility_activity_type add value if not exists 'contract_document_viewed';
  alter type public.facility_activity_type add value if not exists 'contract_archived';
  alter type public.facility_activity_type add value if not exists 'contract_recovered';
end $$;
