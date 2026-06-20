# Technology Research: Public Lead Capture Form

## Summary of Decisions

| Area | Decision | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **Server Logic Delivery** | Next.js Server Action | Offers direct RPC integration, type safety, and fits Next.js 14 App Router patterns. | API Route Handler (held as backup) |
| **Rate Limiting** | In-Memory Sliding Window Map | Lightweight, zero-dependency, and high-performance. Sufficient for single-VPS hosting. | DB-based logging, Redis (rejected as over-engineering for v1) |
| **Input Sanitization** | Regex Tag Stripping + Trim | Basic server-side regex strips HTML tags and scripts to prevent XSS without adding heavy parsing libraries. | `dompurify` (oversized for server-side strings) |
| **Database Access** | Service Role client (Supabase) | Required to bypass Row Level Security (RLS) constraints for public unauthenticated submissions. | Direct client (fails due to RLS) |
| **Uniqueness Check** | CRM-Wide Phone Query | The public form lacks tenant context, so checking phone numbers across all companies prevents cross-company duplicates. | Tenant-scoped check (leads to duplicate records across CRM) |

---

## Detailed Tech Architecture

### 1. In-Memory Rate Limiting
The system will run a singleton helper in `src/lib/rate-limit/memory.ts`. It stores a Map of IP addresses to an array of millisecond timestamps.
On each request:
1. Extract client IP from headers (`x-forwarded-for` or Next.js `headers()`).
2. Clean up timestamps older than 1 hour.
3. If the timestamp array has >= 5 entries, return `true` (rate-limited).
4. Otherwise, push current timestamp and return `false`.

### 2. Input Sanitization
A server-side utility will trim whitespace and strip HTML tags using a standard non-backtracking regex:
```typescript
export function sanitizeString(input: string, maxLength: number): string {
  if (!input) return "";
  const trimmed = input.trim();
  // Strip HTML tags
  const clean = trimmed.replace(/<[^>]*>?/gm, "");
  return clean.slice(0, maxLength);
}
```

### 3. Service Role client (Supabase bypass)
In production, a Supabase client initialized with the `SUPABASE_SERVICE_ROLE_KEY` is required because the public user has no session JWT, but we must write to the `facilities` table.
- **Security Check**: This key is kept strictly on the server-side env and is never leaked to the client.
- **Development Mock**: In the mock database (`src/lib/data/store.ts`), the Server Action will directly mutate `db.facilities` and add to `db.activities`.

### 4. Duplicate archived Lead Reactivation
When a submitted phone number matches an archived facility, the system:
1. Changes `isArchived = false`.
2. Updates `name` and `type` to the newly submitted values.
3. Sets `status = "new"`.
4. Mobs free-text city into the `notes` field (e.g. appending `\n[موقع الويب] المدينة المدخلة: الرياض` to prevent wiping out existing notes).
5. Adds a `facility_recovered` activity log.
