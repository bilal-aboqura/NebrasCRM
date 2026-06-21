export interface TeamRepRow {
  repId: string;
  repName: string;
  isActive: boolean;
  facilitiesAssigned: number;
  followupsCompleted: number;
  callsLogged: number;
  offersSent: number;
  contractsWon: number;
  totalRevenue: number;
}

export function sortTeamRows(rows: TeamRepRow[], key: keyof TeamRepRow, ascending = false) {
  return [...rows].sort((a, b) => {
    const left = a[key]; const right = b[key];
    const result = typeof left === "string" ? left.localeCompare(String(right), "ar") : Number(left) - Number(right);
    return ascending ? result : -result;
  });
}
