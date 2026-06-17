import { getAuthContext, canManageCompanyWide } from "@/lib/auth/context";
import { assertCanManageFacility } from "@/lib/auth/rbac-guards";
import { addActivity, db, formatSar, isPastRiyadhDate, nextId, nowIso } from "@/lib/data/store";
import { assertContractFile, contractStoragePath, createSignedUrl } from "@/lib/secure-storage";
import type { Contract, ContractStatus } from "@/lib/types/domain";

export interface ContractInput {
  facilityId: string;
  offerId?: string;
  title?: string;
  value: number;
  startDate?: string;
  endDate?: string;
}

function nextReference(companyId: string) {
  const count = db.contracts.filter((contract) => contract.companyId === companyId).length + 1;
  return `CON-${new Date().getFullYear()}-${count.toString().padStart(4, "0")}`;
}

export function getContractDisplayStatus(contract: Contract): ContractStatus | "expired" | "expiring_soon" {
  if (contract.status === "active" && contract.endDate) {
    if (isPastRiyadhDate(contract.endDate)) return "expired";
    const diff = new Date(contract.endDate).getTime() - Date.now();
    if (diff < 30 * 24 * 60 * 60 * 1000) return "expiring_soon";
  }
  return contract.status;
}

export async function createContract(input: ContractInput) {
  const context = await getAuthContext();
  const facility = db.facilities.find((item) => item.id === input.facilityId);
  if (!facility) throw new Error("Facility not found");
  assertCanManageFacility(context.role, context.user.id, facility);
  if (input.offerId && db.contracts.some((contract) => contract.offerId === input.offerId && contract.status !== "archived")) {
    throw new Error("Accepted offer already has a contract");
  }
  const sourceOffer = input.offerId ? db.offers.find((offer) => offer.id === input.offerId) : undefined;
  const contract: Contract = {
    id: nextId("ctr", db.contracts),
    companyId: facility.companyId,
    facilityId: facility.id,
    offerId: input.offerId,
    ownerId: context.user.id,
    referenceNumber: nextReference(facility.companyId),
    status: "draft",
    value: sourceOffer?.total ?? input.value,
    startDate: input.startDate,
    endDate: input.endDate,
    title: input.title ?? sourceOffer?.title,
    isActive: true
  };
  db.contracts.push(contract);
  addActivity({ companyId: contract.companyId, facilityId: contract.facilityId, kind: "contract_created", message: `تم إنشاء عقد بقيمة ${formatSar(contract.value)}` });
  return contract;
}

export async function updateDraftContract(id: string, input: Partial<ContractInput>) {
  const contract = db.contracts.find((item) => item.id === id);
  if (!contract) throw new Error("Contract not found");
  if (contract.status !== "draft") throw new Error("Active contracts are immutable");
  Object.assign(contract, input);
  return contract;
}

export async function uploadContractDocument(id: string, file: { name: string; size: number; type: string }) {
  const contract = db.contracts.find((item) => item.id === id);
  if (!contract) throw new Error("Contract not found");
  assertContractFile(file);
  contract.documentPath = contractStoragePath(contract.companyId, contract.id, file.name);
  addActivity({ companyId: contract.companyId, facilityId: contract.facilityId, kind: "contract_document_uploaded", message: "تم رفع وثيقة العقد" });
  return contract.documentPath;
}

export async function activateContract(id: string, input: { startDate: string; endDate: string; documentPath?: string }) {
  const contract = db.contracts.find((item) => item.id === id);
  if (!contract) throw new Error("Contract not found");
  if (new Date(input.endDate) <= new Date(input.startDate)) throw new Error("Contract end date must be after start date");
  const documentPath = input.documentPath ?? contract.documentPath;
  if (!documentPath) throw new Error("Signed document is required before activation");
  contract.status = "active";
  contract.startDate = input.startDate;
  contract.endDate = input.endDate;
  contract.documentPath = documentPath;
  addActivity({ companyId: contract.companyId, facilityId: contract.facilityId, kind: "contract_activated", message: "تم تفعيل العقد" });
  return contract;
}

export async function completeContract(id: string) {
  const context = await getAuthContext();
  if (!canManageCompanyWide(context.role)) throw new Error("403 Forbidden");
  const contract = db.contracts.find((item) => item.id === id);
  if (!contract) throw new Error("Contract not found");
  contract.status = "completed";
  addActivity({ companyId: contract.companyId, facilityId: contract.facilityId, kind: "contract_completed", message: "تم إكمال العقد" });
  return contract;
}

export async function terminateContract(id: string, reason: string) {
  const context = await getAuthContext();
  if (!canManageCompanyWide(context.role)) throw new Error("403 Forbidden");
  const contract = db.contracts.find((item) => item.id === id);
  if (!contract) throw new Error("Contract not found");
  contract.status = "terminated";
  contract.terminationReason = reason;
  addActivity({ companyId: contract.companyId, facilityId: contract.facilityId, kind: "contract_terminated", message: reason });
  return contract;
}

export async function createContractAddendum(parentContractId: string, value: number) {
  const parent = db.contracts.find((item) => item.id === parentContractId);
  if (!parent) throw new Error("Contract not found");
  const addendum: Contract = { ...parent, id: nextId("ctr", db.contracts), parentContractId, referenceNumber: `${parent.referenceNumber}-A${Date.now().toString(36)}`, status: "draft", value };
  db.contracts.push(addendum);
  addActivity({ companyId: addendum.companyId, facilityId: addendum.facilityId, kind: "contract_addendum", message: "تم إنشاء ملحق عقد" });
  return addendum;
}

export async function getContracts(options: { facilityId?: string; status?: ContractStatus | "all"; ownerId?: string } = {}) {
  const context = await getAuthContext();
  return db.contracts.filter((contract) => {
    const facility = db.facilities.find((item) => item.id === contract.facilityId);
    if (!facility || facility.isArchived) return false;
    if (context.role !== "super_admin" && contract.companyId !== context.activeCompany.id) return false;
    if (!canManageCompanyWide(context.role) && facility.ownerId !== context.user.id) return false;
    if (options.facilityId && contract.facilityId !== options.facilityId) return false;
    if (options.ownerId && contract.ownerId !== options.ownerId) return false;
    if (options.status && options.status !== "all" && contract.status !== options.status) return false;
    return contract.isActive !== false;
  });
}

export async function getSignedDocumentUrl(id: string) {
  const contract = db.contracts.find((item) => item.id === id);
  if (!contract?.documentPath) throw new Error("No document found");
  addActivity({ companyId: contract.companyId, facilityId: contract.facilityId, kind: "contract_document_viewed", message: "تم إنشاء رابط آمن لوثيقة العقد" });
  return createSignedUrl(contract.documentPath);
}

export async function archiveContract(id: string) {
  const contract = db.contracts.find((item) => item.id === id);
  if (!contract) throw new Error("Contract not found");
  contract.isActive = false;
  contract.archivedAt = nowIso();
  addActivity({ companyId: contract.companyId, facilityId: contract.facilityId, kind: "contract_archived", message: "تمت أرشفة العقد" });
}

export async function recoverContract(id: string) {
  const contract = db.contracts.find((item) => item.id === id);
  if (!contract) throw new Error("Contract not found");
  contract.isActive = true;
  contract.archivedAt = undefined;
  addActivity({ companyId: contract.companyId, facilityId: contract.facilityId, kind: "contract_recovered", message: "تمت استعادة العقد" });
}
