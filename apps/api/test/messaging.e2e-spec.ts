import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { uniqueEmail } from './test-utils';

const PASSWORD = 'StrongPassword123!';

describe('Messaging and contact sharing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];
  const createdListingIds: string[] = [];

  let university: { id: string };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    university = await prisma.university.create({
      data: { name: `Messaging Spec University ${randomUUID()}`, normalizedName: randomUUID() },
    });
  });

  afterAll(async () => {
    await prisma.message.deleteMany({
      where: { conversation: { application: { listingId: { in: createdListingIds } } } },
    });
    await prisma.conversationParticipant.deleteMany({
      where: { conversation: { application: { listingId: { in: createdListingIds } } } },
    });
    await prisma.conversation.deleteMany({ where: { application: { listingId: { in: createdListingIds } } } });
    await prisma.contactShare.deleteMany({ where: { application: { listingId: { in: createdListingIds } } } });
    await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.application.deleteMany({ where: { listingId: { in: createdListingIds } } });
    await prisma.tuitionListing.deleteMany({ where: { id: { in: createdListingIds } } });
    await prisma.tutorProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.guardianProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.university.delete({ where: { id: university.id } });
    await app.close();
  });

  async function registerAndLogin(
    roles: string[],
    phone?: string,
  ): Promise<{ token: string; userId: string; email: string }> {
    const email = uniqueEmail('messaging-spec');
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: PASSWORD, roles, phone })
      .expect(201);
    const userId = register.body.data.id as string;
    createdUserIds.push(userId);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return { token: login.body.data.accessToken as string, userId, email };
  }

  function authed(token: string) {
    return {
      post: (url: string) => request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`),
      get: (url: string) => request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`),
      patch: (url: string) => request(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${token}`),
    };
  }

  async function createTutorProfile(token: string): Promise<string> {
    const res = await authed(token)
      .post('/api/v1/tutors/me/profile')
      .send({
        universityId: university.id,
        fullName: 'Messaging Spec Tutor',
        department: 'CSE',
        degreeProgram: 'BSc',
        academicStatus: 'CURRENT_STUDENT',
      })
      .expect(201);
    return res.body.data.id as string;
  }

  async function createGuardianProfile(token: string): Promise<void> {
    await authed(token).post('/api/v1/guardians/me/profile').send({ displayName: 'Messaging Spec Guardian' }).expect(201);
  }

  async function createPublishedListing(guardianUserId: string): Promise<string> {
    const listing = await prisma.tuitionListing.create({
      data: {
        guardianUserId,
        title: 'Messaging Spec Listing',
        classLevel: 'Class 9',
        city: 'Dhaka',
        area: 'Dhanmondi',
        daysPerWeek: 3,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    createdListingIds.push(listing.id);
    return listing.id;
  }

  function uniquePhone(prefix: string): string {
    return `01${prefix}${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;
  }

  /** Full setup: guardian + listing + tutor + application, shortlisted (the earliest status contact-sharing allows). */
  async function setupShortlistedApplication() {
    const guardian = await registerAndLogin(['GUARDIAN'], uniquePhone('7'));
    await createGuardianProfile(guardian.token);
    const listingId = await createPublishedListing(guardian.userId);

    const tutor = await registerAndLogin(['TUTOR'], uniquePhone('8'));
    await createTutorProfile(tutor.token);

    const applied = await authed(tutor.token)
      .post(`/api/v1/listings/${listingId}/applications`)
      .send({})
      .expect(201);
    const applicationId = applied.body.data.id as string;

    await authed(guardian.token)
      .patch(`/api/v1/applications/${applicationId}/status`)
      .send({ status: 'SHORTLISTED' })
      .expect(200);

    return { guardian, tutor, listingId, applicationId };
  }

  describe('contact sharing', () => {
    it('rejects sharing before the application is shortlisted', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      await createGuardianProfile(guardian.token);
      const listingId = await createPublishedListing(guardian.userId);
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const applied = await authed(tutor.token).post(`/api/v1/listings/${listingId}/applications`).send({}).expect(201);

      await authed(tutor.token)
        .post(`/api/v1/applications/${applied.body.data.id}/contact-share`)
        .send({ sharePhone: true, shareEmail: false })
        .expect(400);
    });

    it('rejects a non-participant', async () => {
      const { applicationId } = await setupShortlistedApplication();
      const stranger = await registerAndLogin(['TUTOR']);
      await authed(stranger.token)
        .post(`/api/v1/applications/${applicationId}/contact-share`)
        .send({ sharePhone: true, shareEmail: false })
        .expect(404);
    });

    it('reveals a field only once both sides have consented to it, moving the application to CONTACT_REQUESTED', async () => {
      const { guardian, tutor, applicationId } = await setupShortlistedApplication();

      const tutorShare = await authed(tutor.token)
        .post(`/api/v1/applications/${applicationId}/contact-share`)
        .send({ sharePhone: true, shareEmail: false })
        .expect(201);
      expect(tutorShare.body.data.myShared).toEqual({ phone: true, email: false });
      expect(tutorShare.body.data.contact).toEqual({ phone: null, email: null });

      const application = await authed(guardian.token).get(`/api/v1/applications/${applicationId}`).expect(200);
      expect(application.body.data.status).toBe('CONTACT_REQUESTED');

      // Guardian has only shared phone so far too -> mutual on phone, not email.
      const guardianShare = await authed(guardian.token)
        .post(`/api/v1/applications/${applicationId}/contact-share`)
        .send({ sharePhone: true, shareEmail: false })
        .expect(201);
      expect(guardianShare.body.data.contact.phone).not.toBeNull();
      expect(guardianShare.body.data.contact.email).toBeNull();

      const tutorView = await authed(tutor.token).get(`/api/v1/applications/${applicationId}/contact-share`).expect(200);
      expect(tutorView.body.data.contact.phone).not.toBeNull();
      expect(tutorView.body.data.contact.email).toBeNull();
    });

    it('lets the guardian accept once CONTACT_REQUESTED', async () => {
      const { guardian, applicationId } = await setupShortlistedApplication();
      await prisma.application.update({ where: { id: applicationId }, data: { status: 'CONTACT_REQUESTED' } });

      const accepted = await authed(guardian.token)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .send({ status: 'ACCEPTED' })
        .expect(200);
      expect(accepted.body.data.status).toBe('ACCEPTED');
    });
  });

  describe('conversations and messages', () => {
    it('rejects a non-participant from creating a conversation', async () => {
      const { applicationId } = await setupShortlistedApplication();
      const stranger = await registerAndLogin(['GUARDIAN']);
      await authed(stranger.token).post(`/api/v1/applications/${applicationId}/conversation`).expect(404);
    });

    it('creates a conversation and is idempotent on a second call', async () => {
      const { tutor, applicationId } = await setupShortlistedApplication();

      const first = await authed(tutor.token).post(`/api/v1/applications/${applicationId}/conversation`).expect(201);
      const second = await authed(tutor.token).post(`/api/v1/applications/${applicationId}/conversation`).expect(201);
      expect(second.body.data.id).toBe(first.body.data.id);
    });

    it('rejects a non-participant from reading or sending messages', async () => {
      const { tutor, applicationId } = await setupShortlistedApplication();
      const conversation = await authed(tutor.token)
        .post(`/api/v1/applications/${applicationId}/conversation`)
        .expect(201);
      const conversationId = conversation.body.data.id as string;

      const stranger = await registerAndLogin(['TUTOR']);
      await authed(stranger.token).get(`/api/v1/conversations/${conversationId}/messages`).expect(404);
      await authed(stranger.token)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .send({ body: 'hi' })
        .expect(404);
    });

    it('sends messages, both participants can read them, and marks read state', async () => {
      const { guardian, tutor, applicationId } = await setupShortlistedApplication();
      const conversation = await authed(tutor.token)
        .post(`/api/v1/applications/${applicationId}/conversation`)
        .expect(201);
      const conversationId = conversation.body.data.id as string;

      await authed(tutor.token)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .send({ body: 'Hello, I would like to discuss the schedule.' })
        .expect(201);

      const guardianMessages = await authed(guardian.token)
        .get(`/api/v1/conversations/${conversationId}/messages`)
        .expect(200);
      expect(guardianMessages.body.data).toHaveLength(1);
      expect(guardianMessages.body.data[0].body).toContain('schedule');

      const list = await authed(guardian.token).get('/api/v1/conversations').expect(200);
      const entry = list.body.data.find((c: { id: string }) => c.id === conversationId);
      expect(entry.hasUnread).toBe(true);

      await authed(guardian.token).patch(`/api/v1/conversations/${conversationId}/read`).expect(200);

      const listAfterRead = await authed(guardian.token).get('/api/v1/conversations').expect(200);
      const entryAfterRead = listAfterRead.body.data.find((c: { id: string }) => c.id === conversationId);
      expect(entryAfterRead.hasUnread).toBe(false);

      const notifications = await prisma.notification.findMany({
        where: { userId: guardian.userId, type: 'MESSAGE_RECEIVED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    it('rejects an empty or over-length message body', async () => {
      const { tutor, applicationId } = await setupShortlistedApplication();
      const conversation = await authed(tutor.token)
        .post(`/api/v1/applications/${applicationId}/conversation`)
        .expect(201);
      const conversationId = conversation.body.data.id as string;

      await authed(tutor.token).post(`/api/v1/conversations/${conversationId}/messages`).send({ body: '   ' }).expect(400);
      await authed(tutor.token)
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .send({ body: 'a'.repeat(5001) })
        .expect(400);
    });

    it('paginates message history with a reverse cursor', async () => {
      const { tutor, applicationId } = await setupShortlistedApplication();
      const conversation = await authed(tutor.token)
        .post(`/api/v1/applications/${applicationId}/conversation`)
        .expect(201);
      const conversationId = conversation.body.data.id as string;

      for (let i = 0; i < 5; i += 1) {
        await authed(tutor.token)
          .post(`/api/v1/conversations/${conversationId}/messages`)
          .send({ body: `Message ${i}` })
          .expect(201);
      }

      const firstPage = await authed(tutor.token)
        .get(`/api/v1/conversations/${conversationId}/messages?limit=2`)
        .expect(200);
      expect(firstPage.body.data).toHaveLength(2);
      expect(firstPage.body.data.map((m: { body: string }) => m.body)).toEqual(['Message 3', 'Message 4']);
      expect(firstPage.body.meta.nextCursor).toBeTruthy();

      const secondPage = await authed(tutor.token)
        .get(`/api/v1/conversations/${conversationId}/messages?limit=2&before=${firstPage.body.meta.nextCursor}`)
        .expect(200);
      expect(secondPage.body.data.map((m: { body: string }) => m.body)).toEqual(['Message 1', 'Message 2']);
    });
  });
});
