export const CONTRACT_STORAGE_BUCKET = "contracts";
export const CONTRACT_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const CONTRACT_SIGNED_URL_TTL_SECONDS = 15 * 60;
export const CONTRACT_ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

export const OFFER_STORAGE_BUCKET = "offers";
export const OFFER_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const OFFER_SIGNED_URL_TTL_SECONDS = 15 * 60;
export const OFFER_ALLOWED_FILE_TYPES = CONTRACT_ALLOWED_FILE_TYPES;
