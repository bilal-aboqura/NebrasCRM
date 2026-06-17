import ContractEditorModal from "@/components/contracts/ContractEditorModal";
import TerminateContractModal from "@/components/contracts/TerminateContractModal";
import { formatSar } from "@/lib/data/store";
import { contractStatusLabels } from "@/lib/i18n";
import { getContractDisplayStatus } from "@/lib/actions/contracts";
import type { Contract } from "@/lib/types/domain";

export default function ContractsSection({ contracts }: { contracts: Contract[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-nebras-green">العقود</h2>
      <ContractEditorModal />
      {contracts.map((contract) => (
        <article key={contract.id} className="rounded-lg border border-nebras-line bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-bold">{contract.referenceNumber}</p>
              <p className="text-sm text-slate-600">{formatSar(contract.value)} · {contract.startDate ?? "-"} / {contract.endDate ?? "-"}</p>
            </div>
            <span className="rounded-full bg-nebras-cream px-2 py-1 text-xs">{contractStatusLabels[getContractDisplayStatus(contract)]}</span>
          </div>
          {contract.status === "active" ? <div className="mt-3"><TerminateContractModal /></div> : <div className="mt-3"><ContractEditorModal contract={contract} /></div>}
        </article>
      ))}
    </section>
  );
}
