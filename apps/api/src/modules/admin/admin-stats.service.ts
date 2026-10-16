import { Injectable } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type {
  AdminStatsDto,
  FunnelStatsDto,
  GrowthStatsDto,
  QueueStatsDto,
  SignupTrendPoint,
  SupplyDemandGapDto,
  TrustSafetyStatsDto,
} from './dto/admin-stats.dto';

const ALL_ROLES: Role[] = ['TUTOR', 'GUARDIAN', 'VERIFIER', 'MODERATOR', 'ADMIN'];
const NON_TERMINAL_VERIFICATION_STATUSES = ['PENDING', 'IN_REVIEW', 'NEEDS_INFORMATION'] as const;
const OPEN_REPORT_STATUSES = ['OPEN', 'UNDER_REVIEW'] as const;
const SUPPLY_DEMAND_LIMIT = 8;
const MS_PER_DAY = 86_400_000;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function averageAgeDays(createdAts: Date[], now: Date): number | null {
  if (createdAts.length === 0) return null;
  const totalMs = createdAts.reduce((sum, createdAt) => sum + (now.getTime() - createdAt.getTime()), 0);
  return Math.round((totalMs / createdAts.length / MS_PER_DAY) * 10) / 10;
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(days: number): Promise<AdminStatsDto> {
    const now = new Date();
    const periodStart = new Date(now.getTime() - days * MS_PER_DAY);
    const prevPeriodStart = new Date(periodStart.getTime() - days * MS_PER_DAY);

    const [growth, funnel, trustSafety, supplyDemand] = await Promise.all([
      this.getGrowthStats(periodStart, prevPeriodStart, now),
      this.getFunnelStats(periodStart),
      this.getTrustSafetyStats(now),
      this.getSupplyDemandGaps(),
    ]);

    return { periodDays: days, generatedAt: now.toISOString(), growth, funnel, trustSafety, supplyDemand };
  }

  private async getGrowthStats(periodStart: Date, prevPeriodStart: Date, now: Date): Promise<GrowthStatsDto> {
    const [totalUsers, roleGroups, newUsersThisPeriod, newUsersPrevPeriod, recentUsers, activeListings, availableTutors] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.userRole.groupBy({ by: ['role'], _count: { role: true } }),
        this.prisma.user.count({ where: { createdAt: { gte: periodStart } } }),
        this.prisma.user.count({ where: { createdAt: { gte: prevPeriodStart, lt: periodStart } } }),
        this.prisma.user.findMany({
          where: { createdAt: { gte: periodStart } },
          select: { createdAt: true, roles: { select: { role: true } } },
        }),
        this.prisma.tuitionListing.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.tutorProfile.count({ where: { isAvailable: true } }),
      ]);

    const usersByRole = Object.fromEntries(ALL_ROLES.map((role) => [role, 0])) as GrowthStatsDto['usersByRole'];
    for (const group of roleGroups) {
      usersByRole[group.role] = group._count.role;
    }

    const trendByDate = new Map<string, SignupTrendPoint>();
    for (const user of recentUsers) {
      const key = toDateKey(user.createdAt);
      const point = trendByDate.get(key) ?? { date: key, tutors: 0, guardians: 0 };
      const roles = new Set(user.roles.map((r) => r.role));
      if (roles.has('TUTOR')) point.tutors += 1;
      if (roles.has('GUARDIAN')) point.guardians += 1;
      trendByDate.set(key, point);
    }

    const signupTrend: SignupTrendPoint[] = [];
    const days = Math.round((now.getTime() - periodStart.getTime()) / MS_PER_DAY);
    for (let i = days; i >= 0; i--) {
      const key = toDateKey(new Date(now.getTime() - i * MS_PER_DAY));
      signupTrend.push(trendByDate.get(key) ?? { date: key, tutors: 0, guardians: 0 });
    }

    return {
      totalUsers,
      usersByRole,
      newUsersThisPeriod,
      newUsersPrevPeriod,
      newUsersChangePct: percentChange(newUsersThisPeriod, newUsersPrevPeriod),
      signupTrend,
      activeListings,
      availableTutors,
    };
  }

  private async getFunnelStats(periodStart: Date): Promise<FunnelStatsDto> {
    const [listingsCreated, applicationsSubmitted, applicationsAccepted, contactsShared] = await Promise.all([
      this.prisma.tuitionListing.count({ where: { createdAt: { gte: periodStart } } }),
      this.prisma.application.count({ where: { submittedAt: { gte: periodStart } } }),
      this.prisma.application.count({ where: { status: 'ACCEPTED', updatedAt: { gte: periodStart } } }),
      this.prisma.contactShare.count({ where: { consentedAt: { gte: periodStart }, revokedAt: null } }),
    ]);

    return { listingsCreated, applicationsSubmitted, applicationsAccepted, contactsShared };
  }

  private async getTrustSafetyStats(now: Date): Promise<TrustSafetyStatsDto> {
    const [
      verificationGroups,
      openVerifications,
      guardianVerificationGroups,
      openGuardianVerifications,
      reportGroups,
      openReports,
    ] = await Promise.all([
      this.prisma.verificationRequest.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.verificationRequest.findMany({
        where: { status: { in: [...NON_TERMINAL_VERIFICATION_STATUSES] } },
        select: { createdAt: true },
      }),
      this.prisma.guardianVerificationRequest.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.guardianVerificationRequest.findMany({
        where: { status: { in: [...NON_TERMINAL_VERIFICATION_STATUSES] } },
        select: { createdAt: true },
      }),
      this.prisma.report.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.report.findMany({
        where: { status: { in: [...OPEN_REPORT_STATUSES] } },
        select: { createdAt: true },
      }),
    ]);

    const verifications: QueueStatsDto = {
      counts: Object.fromEntries(verificationGroups.map((g) => [g.status, g._count.status])),
      openCount: openVerifications.length,
      avgOpenAgeDays: averageAgeDays(
        openVerifications.map((v) => v.createdAt),
        now,
      ),
    };

    const guardianVerifications: QueueStatsDto = {
      counts: Object.fromEntries(guardianVerificationGroups.map((g) => [g.status, g._count.status])),
      openCount: openGuardianVerifications.length,
      avgOpenAgeDays: averageAgeDays(
        openGuardianVerifications.map((v) => v.createdAt),
        now,
      ),
    };

    const reports: QueueStatsDto = {
      counts: Object.fromEntries(reportGroups.map((g) => [g.status, g._count.status])),
      openCount: openReports.length,
      avgOpenAgeDays: averageAgeDays(
        openReports.map((r) => r.createdAt),
        now,
      ),
    };

    return { verifications, guardianVerifications, reports };
  }

  private async getSupplyDemandGaps(): Promise<SupplyDemandGapDto[]> {
    const [demandGroups, supplyGroups] = await Promise.all([
      this.prisma.listingSubject.groupBy({
        by: ['subjectId'],
        where: { listing: { status: 'PUBLISHED' } },
        _count: { subjectId: true },
      }),
      this.prisma.tutorSubject.groupBy({
        by: ['subjectId'],
        where: { tutorProfile: { isAvailable: true } },
        _count: { subjectId: true },
      }),
    ]);

    const subjectIds = new Set<string>([...demandGroups.map((g) => g.subjectId), ...supplyGroups.map((g) => g.subjectId)]);
    if (subjectIds.size === 0) return [];

    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: [...subjectIds] } },
      select: { id: true, name: true },
    });
    const nameById = new Map(subjects.map((s) => [s.id, s.name]));
    const supplyById = new Map(supplyGroups.map((g) => [g.subjectId, g._count.subjectId]));

    return demandGroups
      .map((g) => {
        const demand = g._count.subjectId;
        const supply = supplyById.get(g.subjectId) ?? 0;
        return {
          subjectId: g.subjectId,
          subjectName: nameById.get(g.subjectId) ?? 'Unknown',
          demand,
          supply,
          gap: demand - supply,
        };
      })
      .sort((a, b) => b.gap - a.gap)
      .slice(0, SUPPLY_DEMAND_LIMIT);
  }
}
