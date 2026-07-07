import {
  CONTRACT_ALLOWED_FILE_TYPES,
  CONTRACT_FILE_MAX_BYTES,
  CONTRACT_SIGNED_URL_TTL_SECONDS,
  CONTRACT_STORAGE_BUCKET,
  OFFER_ALLOWED_FILE_TYPES,
  OFFER_FILE_MAX_BYTES,
  OFFER_SIGNED_URL_TTL_SECONDS,
  OFFER_STORAGE_BUCKET,
} from "@/config/storage";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EncodedUpload {
  base64: string;
  name: string;
  type: string;
}

function safeFileName(name: string) {
  const normalized = name.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "-");
  return normalized.replace(/^-+|-+$/g, "").slice(0, 120) || "document";
}

function decodePrivateFile(
  file: EncodedUpload,
  allowedTypes: readonly string[],
  maxBytes: number,
  sizeError: string,
) {
  if (!allowedTypes.includes(file.type)) {
    throw Object.assign(new Error("يسمح فقط بملفات PDF أو الصور."), { code: "415" });
  }

  const payload = file.base64.includes(",") ? file.base64.slice(file.base64.indexOf(",") + 1) : file.base64;
  if (!payload || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) {
    throw Object.assign(new Error("محتوى الملف غير صالح."), { code: "400" });
  }

  const bytes = Buffer.from(payload, "base64");
  if (!bytes.length || bytes.length > maxBytes) {
    throw Object.assign(new Error(sizeError), { code: "413" });
  }

  return { bytes, name: safeFileName(file.name), type: file.type };
}

export function decodeContractFile(file: EncodedUpload) {
  return decodePrivateFile(
    file,
    CONTRACT_ALLOWED_FILE_TYPES,
    CONTRACT_FILE_MAX_BYTES,
    "يجب ألا يتجاوز حجم ملف العقد 10 ميجابايت.",
  );
}

export function decodeOfferFile(file: EncodedUpload) {
  return decodePrivateFile(
    file,
    OFFER_ALLOWED_FILE_TYPES,
    OFFER_FILE_MAX_BYTES,
    "يجب ألا يتجاوز حجم ملف العرض 10 ميجابايت.",
  );
}

export function contractDocumentPath(companyId: string, contractId: string, name: string) {
  return `company_${companyId}/contracts/${contractId}/${safeFileName(name)}`;
}

export function offerDocumentPath(companyId: string, offerId: string, name: string) {
  return `company_${companyId}/offers/${offerId}/${safeFileName(name)}`;
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

export async function uploadPrivateOfferFile(companyId: string, offerId: string, file: EncodedUpload) {
  const decoded = decodeOfferFile(file);
  const path = offerDocumentPath(companyId, offerId, decoded.name);
  const { error } = await createAdminClient().storage.from(OFFER_STORAGE_BUCKET).upload(path, decoded.bytes, {
    contentType: decoded.type,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

async function createSignedUrl(bucket: string, path: string, ttlSeconds: number) {
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("تعذر إنشاء رابط عرض المستند.");
  return data.signedUrl;
}

export async function createContractSignedUrl(path: string) {
  return createSignedUrl(CONTRACT_STORAGE_BUCKET, path, CONTRACT_SIGNED_URL_TTL_SECONDS);
}

export async function createOfferSignedUrl(path: string) {
  return createSignedUrl(OFFER_STORAGE_BUCKET, path, OFFER_SIGNED_URL_TTL_SECONDS);
}
