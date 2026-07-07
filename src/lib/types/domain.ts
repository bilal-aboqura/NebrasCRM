import type { FollowUpRow, FollowUpType } from "./database";

export type { FollowUpRow, FollowUpType };

export type FacilityLeadSource = "manual" | "website_form" | "imported";

export type FacilityActivityType =
  | "status_change" | "owner_change" | "archived" | "recovered" | "created" | "edited"
  | "followup_create" | "followup_complete" | "call_logged" | "offer_sent"
  | "offer_accepted" | "offer_rejected" | "offer_document_uploaded" | "offer_document_viewed"
  | "contract_activated";

export interface FacilityActivity {
  id: string;
  company_id: string;
  facility_id: string;
  actor_id: string;
  event_type: FacilityActivityType;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}
