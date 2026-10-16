import { BadRequestException, Injectable } from '@nestjs/common';
import type { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationsService } from '../applications/applications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ContactShareStateDto } from './dto/contact-share-state.dto';
import { ShareContactDto } from './dto/share-contact.dto';

/**
 * Sharing is only offered once the owner has shown real interest
 * (SHORTLISTED or later) — matches the decision record's state chain
 * (`SHORTLISTED -> CONTACT_REQUESTED -> ACCEPTED`). Declined/withdrawn/
 * closed applications are dead ends; nothing left to exchange contact over.
 */
const CONTACT_SHARE_ELIGIBLE_STATUSES: ApplicationStatus[] = ['SHORTLISTED', 'CONTACT_REQUESTED', 'ACCEPTED'];

interface SharedFields {
  phone: boolean;
  email: boolean;
}

@Injectable()
export class ContactShareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
    private readonly notifications: NotificationsService,
  ) {}

  async share(userId: string, applicationId: string, dto: ShareContactDto): Promise<ContactShareStateDto> {
    const application = await this.applications.assertParticipant(userId, applicationId);

    if (!CONTACT_SHARE_ELIGIBLE_STATUSES.includes(application.status)) {
      throw new BadRequestException(
        'This application must be shortlisted before contact details can be shared.',
      );
    }

    const counterpartUserId =
      userId === application.tutorUserId ? application.guardianUserId : application.tutorUserId;

    await this.prisma.contactShare.create({
      data: {
        applicationId,
        sharedByUserId: userId,
        recipientUserId: counterpartUserId,
        sharedFields: { phone: dto.sharePhone, email: dto.shareEmail },
      },
    });

    // The one status change this flow drives directly — a no-op once the
    // application is already past SHORTLISTED (see markContactRequested).
    await this.applications.markContactRequested(applicationId, application.status);

    await this.notifications.create(counterpartUserId, 'CONTACT_REQUESTED', { applicationId });

    return this.getState(userId, applicationId);
  }

  async getState(userId: string, applicationId: string): Promise<ContactShareStateDto> {
    const application = await this.applications.assertParticipant(userId, applicationId);
    const counterpartUserId =
      userId === application.tutorUserId ? application.guardianUserId : application.tutorUserId;

    const [mine, theirs] = await Promise.all([
      this.latestShare(applicationId, userId),
      this.latestShare(applicationId, counterpartUserId),
    ]);

    // A field is only ever revealed once BOTH sides have independently
    // consented to share it — never inferred from one side's consent alone
    // (decision record item 8).
    const mutualPhone = Boolean(mine?.fields.phone && theirs?.fields.phone);
    const mutualEmail = Boolean(mine?.fields.email && theirs?.fields.email);

    let contact: { phone: string | null; email: string | null } = { phone: null, email: null };
    if (mutualPhone || mutualEmail) {
      const counterpart = await this.prisma.user.findUniqueOrThrow({
        where: { id: counterpartUserId },
        select: { phone: true, email: true },
      });
      contact = {
        phone: mutualPhone ? counterpart.phone : null,
        email: mutualEmail ? counterpart.email : null,
      };
    }

    return {
      applicationId,
      myShared: mine?.fields ?? { phone: false, email: false },
      counterpartShared: theirs?.fields ?? { phone: false, email: false },
      contact,
      updatedAt: mine?.consentedAt ?? null,
    };
  }

  private async latestShare(
    applicationId: string,
    sharedByUserId: string,
  ): Promise<{ fields: SharedFields; consentedAt: Date } | null> {
    const row = await this.prisma.contactShare.findFirst({
      where: { applicationId, sharedByUserId, revokedAt: null },
      orderBy: { consentedAt: 'desc' },
      select: { sharedFields: true, consentedAt: true },
    });
    if (!row) return null;

    const fields = row.sharedFields as Partial<SharedFields>;
    return { fields: { phone: Boolean(fields.phone), email: Boolean(fields.email) }, consentedAt: row.consentedAt };
  }
}
