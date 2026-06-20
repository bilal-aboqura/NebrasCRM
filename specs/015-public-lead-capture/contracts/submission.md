# Interface Contract: Lead Submission API

This contract defines the integration interface between the client-side public lead-capture form and the server-side action handler.

## Submission Server Action

- **Identifier**: `submitLeadAction` (Server Action)
- **Authentication**: None (Public)
- **Rate Limit**: Max 5 requests per client IP per hour (enforced via request headers / headers lookup)

### Request Payload (Client to Server)

The client sends a plain JavaScript object representing the form submission:

```typescript
export interface LeadSubmissionPayload {
  facilityName: string; // Required, trimmed, max 200 characters, no HTML
  city: string;         // Required, trimmed, max 100 characters, no HTML
  phone: string;        // Required, validated Saudi mobile format
  facilityType: string; // Required, enum value: "مجمع طبي" | "مجمع لطب الأسنان" | "مختبر" | "مركز أشعة" | "مستشفى"
}
```

### Response Payload (Server to Client)

The server action returns a standardized JSON response:

#### 1. Success Response (New Lead Created or Archived Lead Reactivated)
- **Status Code**: `200 OK` (or `{ success: true }` object wrapper)
- **Payload**:
  ```json
  {
    "success": true,
    "message": "تم استلام طلبك بنجاح، سيتواصل معك فريق نبراس الجودة قريباً"
  }
  ```

#### 2. Duplicate Submission Response (Active Lead Exists)
- **Status Code**: `200 OK` (handled gracefully with `success: true` or a specific code to show the custom message without writing to DB)
- **Payload**:
  ```json
  {
    "success": true,
    "duplicate": true,
    "message": "تم تسجيل طلبك مسبقاً، سيتواصل معك فريقنا قريباً"
  }
  ```

#### 3. Client Validation Error Response
- **Status Code**: `400 Bad Request` (or `{ success: false, errors: [...] }`)
- **Payload**:
  ```json
  {
    "success": false,
    "errors": {
      "facilityName": ["اسم المنشأة مطلوب ولا يمكن تركه فارغاً"],
      "phone": ["رقم الجوال المدخل غير صحيح. يجب أن يكون رقماً سعودياً صالحاً"]
    }
  }
  ```

#### 4. Rate Limited Response
- **Status Code**: `429 Too Many Requests` (or `{ success: false, rateLimited: true }`)
- **Payload**:
  ```json
  {
    "success": false,
    "rateLimited": true,
    "message": "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً"
  }
  ```

#### 5. Server Error Response
- **Status Code**: `500 Internal Server Error` (returns generic safe message)
- **Payload**:
  ```json
  {
    "success": false,
    "message": "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً."
  }
  ```

---

## Client GTM Event Contract

When the client receives a successful response where `duplicate` is not true, the following dataLayer event MUST be fired:

```json
{
  "event": "lead_form_submitted",
  "facilityType": "[facilityType]", // e.g., "مجمع طبي"
  "submissionTimestamp": "[ISO String]"
}
```
If the submission is a duplicate, the dataLayer event MUST NOT be fired.
