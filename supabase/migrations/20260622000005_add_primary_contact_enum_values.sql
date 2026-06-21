-- Add missing facility_activity_type enum values used by update_contact_atomic
-- and archive_contact_atomic when the primary contact changes.
-- These values were present in the stored functions but were never added to
-- the enum, causing: "invalid input value for enum public.facility_activity_type"
-- when editing a contact and toggling is_primary.
do $$ begin
  alter type public.facility_activity_type add value if not exists 'primary_changed';
  alter type public.facility_activity_type add value if not exists 'primary_cleared';
end $$;
