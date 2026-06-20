export type FacilityTypeAssessed = 'general' | 'dental';
export type ReadinessTier = 'high' | 'medium' | 'low';
export type AnswerStatus = 'Met' | 'Partially Met' | 'Not Met' | 'Not Applicable';

export interface AssessmentAnswer {
  item_code: string;
  status: AnswerStatus;
  notes?: string;
}

export interface Assessment {
  id: string;
  companyId: string;
  facilityId: string;
  assessedBy: string;
  facilityTypeAssessed: FacilityTypeAssessed;
  overallScore: number;
  readinessTier: ReadinessTier;
  answers: AssessmentAnswer[];
  isActive: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  createdAt: string;
}

export interface AssessmentSummary {
  id: string;
  facilityId: string;
  assessedBy: string;
  facilityTypeAssessed: FacilityTypeAssessed;
  overallScore: number;
  readinessTier: ReadinessTier;
  isActive: boolean;
  createdAt: string;
}
