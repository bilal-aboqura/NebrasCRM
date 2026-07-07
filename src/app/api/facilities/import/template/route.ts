import { requireAuth } from "@/lib/auth/context";
import { excelDownloadHeaders, generateFacilityTemplate } from "@/lib/import-export/generator";
import { canImport, jsonError } from "@/lib/import-export/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RegionRow = {
  id: string;
  name_ar: string;
};

type CityRow = {
  id: string;
  region_id: string | null;
  name_ar: string;
  name_en?: string | null;
};

function buildCityLabels(cities: CityRow[], regions: RegionRow[]) {
  const regionNamesById = new Map(regions.map((region) => [region.id, region.name_ar.trim()]));
  const counts = new Map<string, number>();

  for (const city of cities) {
    if (city.name_en === "Other") continue;
    const cityName = city.name_ar.trim();
    counts.set(cityName, (counts.get(cityName) ?? 0) + 1);
  }

  return Array.from(new Set(
    cities
      .filter((city) => city.name_en !== "Other")
      .map((city) => {
        const cityName = city.name_ar.trim();
        const regionName = city.region_id ? regionNamesById.get(city.region_id)?.trim() : "";
        if ((counts.get(cityName) ?? 0) > 1 && regionName) {
          return `${cityName} - ${regionName}`;
        }
        return cityName;
      }),
  )).sort((left, right) => left.localeCompare(right, "ar"));
}

export async function GET() {
  const context = await requireAuth();
  if (!canImport(context)) return jsonError("غير مصرح لك باستيراد المنشآت.", 403);
  const admin = createAdminClient();
  const [regionsResult, citiesResult] = await Promise.all([
    admin.from("regions").select("id,name_ar").order("name_ar"),
    admin.from("cities").select("id,region_id,name_ar,name_en").order("name_ar"),
  ]);
  if (regionsResult.error) throw regionsResult.error;
  if (citiesResult.error) throw citiesResult.error;

  const workbook = await generateFacilityTemplate(
    buildCityLabels(
      (citiesResult.data ?? []) as CityRow[],
      (regionsResult.data ?? []) as RegionRow[],
    ),
  );
  return new Response(new Uint8Array(workbook), {
    headers: excelDownloadHeaders("نموذج-استيراد-المنشآت.xlsx"),
  });
}
