export type Role = 'TUTOR' | 'GUARDIAN' | 'VERIFIER' | 'MODERATOR' | 'ADMIN';

export interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION' | 'DELETED';
  roles: Role[];
  createdAt: string;
}

export interface AdminActivityListing {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface AdminActivityApplication {
  id: string;
  listingId: string;
  listingTitle: string;
  status: string;
  submittedAt: string;
}

export interface AdminActivityVerification {
  id: string;
  type: string;
  status: string;
  submittedAt: string;
}

export interface AdminActivityReport {
  id: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface AdminNote {
  id: string;
  body: string;
  author: { id: string; email: string | null };
  createdAt: string;
}

export interface AdminUserDetail {
  user: AdminUser;
  tutorProfile:
    | {
        id: string;
        fullName: string;
        university: { id: string; name: string };
        academicStatus: string;
        department: string;
        degreeProgram: string;
        academicYear: string | null;
        introduction: string | null;
        subjects: { id: string; name: string }[];
        grades: string[];
        curricula: { id: string; name: string }[];
        locations: { city: string; area: string; neighborhood: string | null }[];
        preferredFeeMin: number | null;
        preferredFeeMax: number | null;
        feeCurrency: string;
        isVerified: boolean;
      }
    | null;
  tutorIsAvailable: boolean | null;
  guardianProfile: { id: string; displayName: string; language: string | null } | null;
  activity: {
    listings: AdminActivityListing[];
    applications: AdminActivityApplication[];
    verificationRequests: AdminActivityVerification[];
    guardianVerificationRequests: AdminActivityVerification[];
    reportsFiled: AdminActivityReport[];
    reportsAgainst: AdminActivityReport[];
  };
  notes: AdminNote[];
}

export interface AuditLogEntry {
  id: string;
  actor: { id: string; email: string | null } | null;
  action: string;
  targetType: string;
  targetId: string | null;
  outcome: string;
  metadata: unknown;
  createdAt: string;
}

export interface SignupTrendPoint {
  date: string;
  tutors: number;
  guardians: number;
}

export interface GrowthStats {
  totalUsers: number;
  usersByRole: Record<'TUTOR' | 'GUARDIAN' | 'VERIFIER' | 'MODERATOR' | 'ADMIN', number>;
  newUsersThisPeriod: number;
  newUsersPrevPeriod: number;
  newUsersChangePct: number | null;
  signupTrend: SignupTrendPoint[];
  activeListings: number;
  availableTutors: number;
}

export interface FunnelStats {
  listingsCreated: number;
  applicationsSubmitted: number;
  applicationsAccepted: number;
  contactsShared: number;
}

export interface QueueStats {
  counts: Record<string, number>;
  openCount: number;
  avgOpenAgeDays: number | null;
}

export interface TrustSafetyStats {
  verifications: QueueStats;
  guardianVerifications: QueueStats;
  reports: QueueStats;
}

export interface SupplyDemandGap {
  subjectId: string;
  subjectName: string;
  demand: number;
  supply: number;
  gap: number;
}

export interface AdminStats {
  periodDays: number;
  generatedAt: string;
  growth: GrowthStats;
  funnel: FunnelStats;
  trustSafety: TrustSafetyStats;
  supplyDemand: SupplyDemandGap[];
}
