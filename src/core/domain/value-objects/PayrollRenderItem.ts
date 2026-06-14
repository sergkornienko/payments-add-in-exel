export interface PayrollRenderItem {
  fullName: string;
  militaryRank: string;
  dateRange: string;
  days: number;
  unit?: string;
  taxPayerId?: string;
  reason?: string;
}
