# Quickstart: Bulk Import & Export (Feature 011)

Follow these steps to set up, run, and test the bulk import and export capabilities.

## 1. Install Dependencies

You must install `xlsx` (SheetJS) dependency for handling Excel/CSV files server-side:

```bash
npm install xlsx
```

## 2. Run Database Migrations

Apply the migration file to set up the new `system_settings` and `import_batches` tables along with their RLS policies.

```bash
# If using supabase CLI locally:
supabase migration db push
```

Or execute the SQL scripts in the Supabase Dashboard SQL Editor.

## 3. Configuration

By default, the `max_import_rows` is seeded to `1000`. You can verify or update this value in the `system_settings` table:

```sql
SELECT value FROM public.system_settings WHERE key = 'max_import_rows';
```

## 4. Running the Development Server

Start the application:

```bash
npm run dev
```

## 5. Manual Testing Flow

### Test Template Download
1. Log in as a `Company Admin`.
2. Navigate to `/dashboard/facilities`.
3. Click on the **استيراد من Excel** (Import from Excel) button to open the modal/drawer.
4. Click **تحميل القالب** (Download Template) and check that `template.xlsx` downloads.
5. Verify it contains the required Arabic headers in RTL order.

### Test Preview & Import validation
1. Create a dummy test sheet with >1000 rows. Upload it and verify you get an error message in Arabic: `عدد الصفوف يتجاوز الحد الأقصى المسموح به (1000 صف)`.
2. Create a test sheet with:
   - 2 valid rows
   - 1 row with an invalid phone format (e.g. `12345`)
   - 1 row with duplicate primary phone (matching a facility already in the database)
   - 1 row with duplicate primary phone (duplicated inside the file itself)
3. Upload this file. Verify the preview dashboard shows:
   - Correct count of valid, errors, and duplicates.
   - Arabic explanations for validation and duplicate rows.
   - **تأكيد الاستيراد** (Confirm Import) commits only the valid rows.

### Test Export
1. From `/dashboard/facilities`, select filters (e.g., City = Riyadh, Status = New).
2. Click **تصدير Excel** (Export Excel).
3. Open the downloaded file and verify it only contains rows matching the filter and only from your company (tenant isolated).
