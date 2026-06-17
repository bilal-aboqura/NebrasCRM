"use client";

import KanbanColumn from "@/components/pipeline/KanbanColumn";
import MobileTabbedHeader from "@/components/pipeline/MobileTabbedHeader";
import type { PipelineColumn } from "@/lib/actions/pipeline";

export default function KanbanBoard({ columns }: { columns: PipelineColumn[] }) {
  return (
    <div className="space-y-4">
      <MobileTabbedHeader statuses={columns.map((column) => column.status)} />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => <KanbanColumn key={column.status} column={column} />)}
      </div>
    </div>
  );
}
