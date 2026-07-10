"use client";

import { useCallback, useEffect, useState } from "react";

export interface ContractInvoice {
  id: string;
  contractId: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt: string | null;
  createdAt: string;
}

function storageKey(contractId: string) {
  return `nebras_invoices_${contractId}`;
}

function loadInvoices(contractId: string): ContractInvoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(contractId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveInvoices(contractId: string, invoices: ContractInvoice[]) {
  try {
    localStorage.setItem(storageKey(contractId), JSON.stringify(invoices));
  } catch {
    // ignore storage errors
  }
}

export function useContractInvoices(contractId: string) {
  const [invoices, setInvoices] = useState<ContractInvoice[]>(() =>
    loadInvoices(contractId),
  );

  // Sync from localStorage if contractId changes
  useEffect(() => {
    setInvoices(loadInvoices(contractId));
  }, [contractId]);

  const persist = useCallback(
    (next: ContractInvoice[]) => {
      setInvoices(next);
      saveInvoices(contractId, next);
    },
    [contractId],
  );

  const addInvoice = useCallback(
    (input: { description: string; amount: number; dueDate: string }) => {
      const invoice: ContractInvoice = {
        id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        contractId,
        description: input.description.trim(),
        amount: input.amount,
        dueDate: input.dueDate,
        paid: false,
        paidAt: null,
        createdAt: new Date().toISOString(),
      };
      persist([...invoices, invoice]);
    },
    [contractId, invoices, persist],
  );

  const markPaid = useCallback(
    (invoiceId: string) => {
      persist(
        invoices.map((inv) =>
          inv.id === invoiceId
            ? { ...inv, paid: true, paidAt: new Date().toISOString() }
            : inv,
        ),
      );
    },
    [invoices, persist],
  );

  const markUnpaid = useCallback(
    (invoiceId: string) => {
      persist(
        invoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, paid: false, paidAt: null } : inv,
        ),
      );
    },
    [invoices, persist],
  );

  const deleteInvoice = useCallback(
    (invoiceId: string) => {
      persist(invoices.filter((inv) => inv.id !== invoiceId));
    },
    [invoices, persist],
  );

  const totalPaid = invoices.filter((inv) => inv.paid).reduce((s, inv) => s + inv.amount, 0);
  const totalInvoiced = invoices.reduce((s, inv) => s + inv.amount, 0);

  return { invoices, addInvoice, markPaid, markUnpaid, deleteInvoice, totalPaid, totalInvoiced };
}
