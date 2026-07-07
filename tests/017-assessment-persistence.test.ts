import { beforeEach, describe, expect, test, vi } from "vitest";
import type { AuthContext } from "@/lib/auth/types";
import { CBAHI_DATA } from "@/lib/data/cbahi-data";
import type { AssessmentAnswer } from "@/lib/types/assessment";

const mocks = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  createAdminClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/context", () => ({ getAuthContext: mocks.getAuthContext }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  archiveAssessment,
  getFacilityAssessments,
  recoverAssessment,
  saveAssessment,
} from "@/lib/actions/assessment-actions";

type Row = Record<string, unknown>;
type TestDatabase = {
  facilities: Row[];
  assessments: Row[];
  facility_activity: Row[];
  contacts: Row[];
  shared_assessment_leads: Row[];
  system_settings: Row[];
};

class Query implements PromiseLike<{ data: unknown; error: null }> {
  private operation: "select" | "insert" | "update" = "select";
  private payload: Row | null = null;
  private filters: Array<[string, unknown]> = [];

  constructor(private database: TestDatabase, private table: keyof TestDatabase) {}

  select() {
    return this;
  }

  insert(payload: Row) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const result = this.execute() as Row[];
    result.sort((left, right) => {
      const comparison = String(left[column]).localeCompare(String(right[column]));
      return options?.ascending === false ? -comparison : comparison;
    });
    return Promise.resolve({ data: result, error: null });
  }

  single() {
    return Promise.resolve({ data: this.executeOne(), error: null });
  }

  maybeSingle() {
    return Promise.resolve({ data: this.executeOne() ?? null, error: null });
  }

  then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve({ data: this.execute(), error: null }).then(onfulfilled, onrejected);
  }

  private matchingRows() {
    return this.database[this.table].filter((row) =>
      this.filters.every(([column, value]) => row[column] === value),
    );
  }

  private executeOne() {
    const result = this.execute();
    return Array.isArray(result) ? result[0] : result;
  }

  private execute(): Row | Row[] {
    if (this.operation === "insert") {
      const row = {
        id: this.payload?.id ?? `${this.table}-${this.database[this.table].length + 1}`,
        created_at: this.payload?.created_at ?? "2026-06-22T00:00:00.000Z",
        is_active: this.payload?.is_active ?? true,
        archived_at: this.payload?.archived_at ?? null,
        archived_by: this.payload?.archived_by ?? null,
        ...this.payload,
      };
      this.database[this.table].push(row);
      return row;
    }

    const rows = this.matchingRows();
    if (this.operation === "update") {
      rows.forEach((row) => Object.assign(row, this.payload));
    }
    return rows;
  }
}

function createAdmin(database: TestDatabase) {
  return {
    from(table: keyof TestDatabase) {
      return new Query(database, table);
    },
  };
}

function auth(role: AuthContext["role"] = "sales_user"): AuthContext {
  return {
    userId: role === "sales_user" ? "user-sales" : "user-manager",
    email: "user@example.com",
    fullName: "Test User",
    role,
    companyId: "company-a",
    activeCompanyId: "company-a",
    companyName: "Company A",
    status: "active",
  };
}

function assessmentRow(overrides: Row = {}): Row {
  return {
    id: "assessment-1",
    company_id: "company-a",
    facility_id: "facility-a",
    assessed_by: "user-sales",
    facility_type_assessed: "general",
    overall_score: 45,
    readiness_tier: "low",
    answers: [],
    is_active: true,
    archived_at: null,
    archived_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("assessment persistence server actions", () => {
  let database: TestDatabase;

  beforeEach(() => {
    database = {
      facilities: [{
        id: "facility-a",
        company_id: "company-a",
        assigned_to: "user-sales",
        is_active: true,
        name_ar: "مجمع ألف",
        city_custom: "الرياض",
        primary_phone: "0501234567",
      }],
      assessments: [],
      facility_activity: [],
      contacts: [{
        id: "contact-a",
        facility_id: "facility-a",
        company_id: "company-a",
        name_ar: "أحمد خالد",
        email: "ahmed@example.com",
        is_primary: true,
        is_archived: false,
      }],
      shared_assessment_leads: [],
      system_settings: [],
    };
    mocks.getAuthContext.mockReset().mockResolvedValue(auth());
    mocks.createAdminClient.mockReset().mockReturnValue(createAdmin(database));
    mocks.revalidatePath.mockReset();
  });

  test("recalculates score and tier before persisting", async () => {
    const codes = CBAHI_DATA.general.chapters.flatMap((chapter) => chapter.items.map((item) => item.code));
    const answers: AssessmentAnswer[] = [
      { item_code: codes[0], status: "Met" },
      { item_code: codes[1], status: "Met" },
      { item_code: codes[2], status: "Not Met" },
      { item_code: codes[3], status: "Not Applicable" },
    ];

    const result = await saveAssessment({
      facilityId: "facility-a",
      facilityTypeAssessed: "general",
      answers,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.assessment.overallScore).toBe(67);
    expect(result.assessment.readinessTier).toBe("medium");
    expect(database.assessments[0]).toMatchObject({ overall_score: 67, readiness_tier: "medium" });
    expect(database.facility_activity[0]).toMatchObject({
      facility_id: "facility-a",
      event_type: "assessment_saved",
    });
    expect(database.shared_assessment_leads[0]).toMatchObject({
      facility_name: "مجمع ألف",
      contact_name: "أحمد خالد",
      city: "الرياض",
      phone: "0501234567",
      overall_score: 67,
      readiness_tier: "medium",
      facility_type_assessed: "general",
    });
  });

  test("enforces tenant and facility assignment isolation", async () => {
    const result = await saveAssessment({
      facilityId: "facility-from-another-company",
      facilityTypeAssessed: "general",
      answers: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Unauthorized: You do not have permission to assess this facility.",
    });
    expect(database.assessments).toHaveLength(0);
  });

  test("returns newest-first history with progression deltas", async () => {
    database.assessments.push(
      assessmentRow(),
      assessmentRow({
        id: "assessment-2",
        overall_score: 78,
        readiness_tier: "medium",
        created_at: "2026-06-01T00:00:00.000Z",
      }),
    );

    const result = await getFacilityAssessments("facility-a");

    expect(result.map((assessment) => assessment.id)).toEqual(["assessment-2", "assessment-1"]);
    expect(result[0]).toMatchObject({ previousScore: 45, delta: 33 });
    expect(result[1]).not.toHaveProperty("previousScore");
  });

  test("restricts archive actions and lets managers archive and recover", async () => {
    database.assessments.push(assessmentRow());

    const denied = await archiveAssessment("assessment-1");
    expect(denied.success).toBe(false);
    expect(database.assessments[0].is_active).toBe(true);

    mocks.getAuthContext.mockResolvedValue(auth("supervisor"));
    const archived = await archiveAssessment("assessment-1");
    expect(archived.success).toBe(true);
    expect(database.assessments[0]).toMatchObject({ is_active: false, archived_by: "user-manager" });

    const recovered = await recoverAssessment("assessment-1");
    expect(recovered.success).toBe(true);
    expect(database.assessments[0]).toMatchObject({ is_active: true, archived_at: null, archived_by: null });
    expect(database.facility_activity.map((row) => row.event_type)).toEqual([
      "assessment_archived",
      "assessment_recovered",
    ]);
  });
});
