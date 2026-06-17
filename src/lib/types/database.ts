export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "super_admin" | "company_admin" | "supervisor" | "sales_user";
      facility_status: "new" | "contacted" | "qualified" | "proposal" | "contract" | "lost";
      followup_status: "pending" | "done" | "cancelled";
      offer_status: "draft" | "sent" | "accepted" | "rejected" | "superseded" | "archived";
      contract_status: "draft" | "active" | "completed" | "terminated" | "archived";
    };
  };
}
