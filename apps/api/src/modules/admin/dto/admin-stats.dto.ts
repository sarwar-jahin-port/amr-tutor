export interface SignupTrendPoint {
  date: string;
  tutors: number;
  guardians: number;
}

export interface GrowthStatsDto {
  totalUsers: number;
  usersByRole: Record<'TUTOR' | 'GUARDIAN' | 'VERIFIER' | 'MODERATOR' | 'ADMIN', number>;
  newUsersThisPeriod: number;
  newUsersPrevPeriod: number;
  newUsersChangePct: number | null;
  signupTrend: SignupTrendPoint[];
  activeListings: number;
  availableTutors: number;
}

export interface FunnelStatsDto {
  listingsCreated: number;
  applicationsSubmitted: number;
  applicationsAccepted: number;
  contactsShared: number;
}

export interface QueueStatsDto {
  counts: Record<string, number>;
  openCount: number;
  avgOpenAgeDays: number | null;
}

export interface TrustSafetyStatsDto {
  verifications: QueueStatsDto;
  guardianVerifications: QueueStatsDto;
  reports: QueueStatsDto;
}

export interface SupplyDemandGapDto {
  subjectId: string;
  subjectName: string;
  demand: number;
  supply: number;
  gap: number;
}

export interface AdminStatsDto {
  periodDays: number;
  generatedAt: string;
  growth: GrowthStatsDto;
  funnel: FunnelStatsDto;
  trustSafety: TrustSafetyStatsDto;
  supplyDemand: SupplyDemandGapDto[];
}
