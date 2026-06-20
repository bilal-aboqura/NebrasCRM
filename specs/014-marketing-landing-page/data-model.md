# Data Model & Static Configurations: Public Marketing Landing Page

## Database Entities
This feature is completely static and public. No new database tables, fields, or RLS policies are created or modified.

## Static UI Data Structures
The page structure utilizes static arrays for services, stats, and trust features. These are structured as follows in the page component to keep the code modular and clean:

### 1. Statistics Structure
```typescript
interface StatisticItem {
  value: string;       // e.g. "+65"
  label: string;       // e.g. "مجمع طبي ومنشأة تم دعمها"
}
```

### 2. Service Item Structure
```typescript
interface ServiceItem {
  id: string;          // HTML anchor or identifier
  emoji: string;       // Emoji visual indicator
  title: string;       // Service title in Arabic
  description: string; // Service description in Arabic
}
```

### 3. Trust Feature Structure
```typescript
interface TrustFeature {
  title: string;       // e.g. "خبراء معتمدون"
  description: string; // Short description copy
}
```
