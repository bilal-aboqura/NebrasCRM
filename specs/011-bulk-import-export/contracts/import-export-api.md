# Interface Contracts: Bulk Import & Export (Feature 011)

This document details the interface schemas, inputs, and response structures for the import and export routes.

## 1. Static/Generated Template File
- **Endpoint**: `/api/facilities/import/template` (GET)
- **Role Access**: `super_admin`, `company_admin`, `supervisor`
- **Output**: Binary download of `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` containing Arabic headers:
  - Row 1: `اسم المنشأة`, `نوع المنشأة`, `المدينة`, `المنطقة`, `الهاتف الرئيسي`, `الهاتف الفرعي`, `مصدر العميل`, `ملاحظات`

---

## 2. File Upload & Preview Action/Handler
- **Endpoint**: `/api/facilities/import/preview` (POST)
- **Role Access**: `super_admin`, `company_admin`, `supervisor`
- **Payload**: `multipart/form-data` containing `file` (Excel or CSV)
- **Response Format**: `application/json`
- **Success Schema (200 OK)**:
```json
{
  "batchId": "uuid-string",
  "summary": {
    "total": 5,
    "valid": 3,
    "errors": 1,
    "duplicates": 1
  },
  "rows": [
    {
      "index": 1,
      "status": "valid",
      "data": {
        "name": "مجمع عيادات الأمل",
        "type": "مجمع طبي",
        "city": "الرياض",
        "region": "الرياض",
        "primary_phone": "+966512345678",
        "secondary_phone": null,
        "lead_source": "imported",
        "notes": "تم النقل من النظام القديم"
      },
      "errors": []
    },
    {
      "index": 2,
      "status": "error",
      "data": {
        "name": "",
        "type": "مستشفى",
        "city": "جدة",
        "region": "مكة",
        "primary_phone": "+966599999999"
      },
      "errors": ["اسم المنشأة مطلوب ولا يمكن تركه فارغاً"]
    },
    {
      "index": 3,
      "status": "duplicate",
      "data": {
        "name": "مركز النور لطب الأسنان",
        "type": "مجمع لطب الأسنان",
        "city": "الدمام",
        "region": "الشرقية",
        "primary_phone": "+966555555555"
      },
      "errors": ["رقم الهاتف الرئيسي مستخدم بالفعل في منشأة أخرى للشركة"]
    }
  ]
}
```

- **Error Schema (400 Bad Request / 403 Forbidden)**:
```json
{
  "error": "الملف المرفوع يتجاوز الحد الأقصى المسموح به (1000 صف)"
}
```

---

## 3. Confirm Import Action
- **Endpoint**: `/api/facilities/import/confirm` (POST)
- **Payload**:
```json
{
  "batchId": "uuid-string"
}
```
- **Response Schema (200 OK)**:
```json
{
  "success": true,
  "importedCount": 3,
  "skippedCount": 2
}
```

---

## 4. Export Facilities/Lists Endpoint
- **Endpoint**: `/api/facilities/export` (GET)
- **Role Access**: `super_admin`, `company_admin`, `supervisor`, `sales_user` (Inherits client RLS context)
- **Query Params**:
  - `status`: string (filter)
  - `city`: string (filter)
  - `type`: string (filter)
  - `assigned_to`: string (filter)
- **Output**: Binary download of `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` containing filters and rows scoped by user's company and permissions.
- **RTL orientation**: Columns sorted Right-to-Left with Arabic headers matching DB entity fields.
