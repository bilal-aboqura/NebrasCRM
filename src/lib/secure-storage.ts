import { CONTRACT_UPLOAD_CONFIG } from "@/config/storage";

export function assertContractFile(file: { size: number; type: string }) {
  if (file.size > CONTRACT_UPLOAD_CONFIG.maxBytes) {
    throw new Error("Contract file exceeds the 10MB upload limit");
  }

  if (!CONTRACT_UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    throw new Error("Only PDF contract documents are allowed");
  }
}

export function contractStoragePath(companyId: string, contractId: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${companyId}/${contractId}/${Date.now()}-${safeName}`;
}

export async function createSignedUrl(path: string) {
  return {
    path,
    expiresIn: 15 * 60,
    signedUrl: `/api/contracts/signed?path=${encodeURIComponent(path)}`
  };
}
