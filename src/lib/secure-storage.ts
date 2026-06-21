import {
  CONTRACT_ALLOWED_FILE_TYPES,
  CONTRACT_FILE_MAX_BYTES,
  CONTRACT_SIGNED_URL_TTL_SECONDS,
  CONTRACT_STORAGE_BUCKET,
} from "@/config/storage";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EncodedUpload {
  base64: string;
  name: string;
  type: string;
}

function safeFileName(name: string) {
  const normalized = name.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "-");
  return normalized.replace(/^-+|-+$/g, "").slice(0, 120) || "contract-document";
}

export function decodeContractFile(file: EncodedUpload) {
  if (!CONTRACT_ALLOWED_FILE_TYPES.includes(file.type as (typeof CONTRACT_ALLOWED_FILE_TYPES)[number])) {
    throw Object.assign(new Error("يسمح فقط بملفات PDF أو الصور."), { code: "415" });
  }
  const payload = file.base64.includes(",") ? file.base64.slice(file.base64.indexOf(",") + 1) : file.base64;
  if (!payload || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) {
    throw Object.assign(new Error("محتوى الملف غير صالح."), { code: "400" });
  }
  const bytes = Buffer.from(payload, "base64");
  if (!bytes.length || bytes.length > CONTRACT_FILE_MAX_BYTES) {
    throw Object.assign(new Error("يجب ألا يتجاوز حجم ملف العقد 10 ميجابايت."), { code: "413" });
  }
  return { bytes, name: safeFileName(file.name), type: file.type };
}

export function contractDocumentPath(companyId: string, contractId: string, name: string) {
  return `company_${companyId}/contracts/${contractId}/${safeFileName(name)}`;
}

export async function uploadPrivateContractFile(companyId: string, contractId: string, file: EncodedUpload) {
  const decoded = decodeContractFile(file);
  const path = contractDocumentPath(companyId, contractId, decoded.name);
  const { error } = await createAdminClient().storage.from(CONTRACT_STORAGE_BUCKET).upload(path, decoded.bytes, {
    contentType: decoded.type,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function createContractSignedUrl(path: string) {
  const { data, error } = await createAdminClient().storage
    .from(CONTRACT_STORAGE_BUCKET)
    .createSignedUrl(path, CONTRACT_SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("تعذر إنشاء رابط عرض مستند العقد.");
  return data.signedUrl;
}

