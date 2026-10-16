import type { SafeUserDto } from '../../../common/dto/safe-user.dto';
import type { GuardianProfileDto } from '../../guardians/guardian-profile.service';
import type { PublicTutorProfileDto } from '../../tutors/dto/public-tutor.dto';
import type { AdminNoteDto } from './admin-note.dto';

export interface ActivityListingDto {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
}

export interface ActivityApplicationDto {
  id: string;
  listingId: string;
  listingTitle: string;
  status: string;
  submittedAt: Date;
}

export interface ActivityVerificationDto {
  id: string;
  type: string;
  status: string;
  submittedAt: Date;
}

export interface ActivityReportDto {
  id: string;
  category: string;
  status: string;
  createdAt: Date;
}

export interface AdminUserDetailDto {
  user: SafeUserDto;
  tutorProfile: PublicTutorProfileDto | null;
  /** Not on the public-safe `tutorProfile` shape — admin needs it to judge supply/demand accuracy and to edit it. */
  tutorIsAvailable: boolean | null;
  guardianProfile: GuardianProfileDto | null;
  activity: {
    listings: ActivityListingDto[];
    applications: ActivityApplicationDto[];
    verificationRequests: ActivityVerificationDto[];
    guardianVerificationRequests: ActivityVerificationDto[];
    reportsFiled: ActivityReportDto[];
    reportsAgainst: ActivityReportDto[];
  };
  notes: AdminNoteDto[];
}
