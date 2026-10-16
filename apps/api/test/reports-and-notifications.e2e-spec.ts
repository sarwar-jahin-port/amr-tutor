import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { uniqueEmail } from './test-utils';

const PASSWORD = 'StrongPassword123!';

describe('Reports and notifications (e2e)', () => {
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
      data: { name: `Reports Spec University ${randomUUID()}`, normalizedName: randomUUID() },
    });
  });

  afterAll(async () => {
    await prisma.report.deleteMany({ where: { reporterUserId: { in: createdUserIds } } });
    await prisma.application.deleteMany({ where: { listingId: { in: createdListingIds } } });
    await prisma.tuitionListing.deleteMany({ where: { id: { in: createdListingIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.tutorProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.guardianProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.university.delete({ where: { id: university.id } });
    await app.close();
  });

  async function registerAndLogin(roles: string[]): Promise<{ token: string; userId: string }> {
    const email = uniqueEmail('reports-spec');
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: PASSWORD, roles })
      .expect(201);
    const userId = register.body.data.id as string;
    createdUserIds.push(userId);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return { token: login.body.data.accessToken as string, userId };
  }

  async function grantRole(userId: string, role: 'MODERATOR' | 'ADMIN'): Promise<void> {
    await prisma.userRole.create({ data: { userId, role } });
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
        fullName: 'Reports Spec Tutor',
        department: 'CSE',
        degreeProgram: 'BSc',
        academicStatus: 'CURRENT_STUDENT',
      })
      .expect(201);
    return res.body.data.id as string;
  }

  async function createPublishedListing(guardianUserId: string): Promise<string> {
    const listing = await prisma.tuitionListing.create({
      data: {
        guardianUserId,
        title: 'Reports Spec Listing',
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

  describe('filing reports', () => {
    it('rejects providing zero or multiple targets', async () => {
      const reporter = await registerAndLogin(['GUARDIAN']);
      await authed(reporter.token).post('/api/v1/reports').send({ category: 'SPAM' }).expect(400);

      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      await authed(reporter.token)
        .post('/api/v1/reports')
        .send({ category: 'SPAM', listingId, targetUserId: guardian.userId })
        .expect(400);
    });

    it('rejects reporting yourself', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      await authed(guardian.token).post('/api/v1/reports').send({ category: 'OTHER', targetUserId: guardian.userId }).expect(400);
    });

    it('resolves a tutorProfileId target to the tutor without exposing a raw userId field', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      const tutorProfileId = await createTutorProfile(tutor.token);
      const reporter = await registerAndLogin(['GUARDIAN']);

      const created = await authed(reporter.token)
        .post('/api/v1/reports')
        .send({ category: 'FALSE_CREDENTIALS', tutorProfileId, description: 'Credentials look fabricated.' })
        .expect(201);
      expect(created.body.data.target).toEqual({ type: 'USER', id: tutor.userId });
    });

    it('creates a listing report and rejects a duplicate while it is still open', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      const reporter = await registerAndLogin(['GUARDIAN']);

      const created = await authed(reporter.token)
        .post('/api/v1/reports')
        .send({ category: 'SPAM', listingId, description: 'Looks like spam.' })
        .expect(201);
      expect(created.body.data.status).toBe('OPEN');

      await authed(reporter.token).post('/api/v1/reports').send({ category: 'SPAM', listingId }).expect(409);
    });

    it('lists only the reporter\'s own reports, hiding resolution/moderator fields', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      const reporter = await registerAndLogin(['GUARDIAN']);
      await authed(reporter.token).post('/api/v1/reports').send({ category: 'SPAM', listingId }).expect(201);

      const mine = await authed(reporter.token).get('/api/v1/users/me/reports').expect(200);
      expect(mine.body.data.length).toBeGreaterThanOrEqual(1);
      expect(mine.body.data[0]).not.toHaveProperty('resolution');
      expect(mine.body.data[0]).not.toHaveProperty('assignedModeratorId');

      const other = await registerAndLogin(['GUARDIAN']);
      const theirs = await authed(other.token).get('/api/v1/users/me/reports').expect(200);
      expect(theirs.body.data).toHaveLength(0);
    });
  });

  describe('moderator queue and resolution', () => {
    it('rejects a non-moderator from the queue', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      await authed(guardian.token).get('/api/v1/admin/reports').expect(403);
    });

    it('enforces OPEN -> UNDER_REVIEW -> ACTION_TAKEN|DISMISSED and requires a resolution to close', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      const reporter = await registerAndLogin(['GUARDIAN']);
      const created = await authed(reporter.token).post('/api/v1/reports').send({ category: 'SCAM', listingId }).expect(201);
      const reportId = created.body.data.id as string;

      const moderator = await registerAndLogin(['GUARDIAN']);
      await grantRole(moderator.userId, 'MODERATOR');

      // Can't skip straight to ACTION_TAKEN from OPEN.
      await authed(moderator.token).patch(`/api/v1/admin/reports/${reportId}/status`).send({ status: 'ACTION_TAKEN', resolution: 'x' }).expect(400);

      await authed(moderator.token).patch(`/api/v1/admin/reports/${reportId}/status`).send({ status: 'UNDER_REVIEW' }).expect(200);

      // Requires a resolution note to close.
      await authed(moderator.token).patch(`/api/v1/admin/reports/${reportId}/status`).send({ status: 'DISMISSED' }).expect(400);

      const dismissed = await authed(moderator.token)
        .patch(`/api/v1/admin/reports/${reportId}/status`)
        .send({ status: 'DISMISSED', resolution: 'No policy violation found.' })
        .expect(200);
      expect(dismissed.body.data.status).toBe('DISMISSED');
      expect(dismissed.body.data.resolution).toBe('No policy violation found.');

      const notifications = await prisma.notification.findMany({ where: { userId: reporter.userId, type: 'REPORT_UPDATED' } });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('notifications', () => {
    it('lists a user\'s own notifications, tracks unread count, and supports marking read', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      await authed(tutor.token).post(`/api/v1/listings/${listingId}/applications`).send({}).expect(201);

      const unreadBefore = await authed(guardian.token).get('/api/v1/notifications/unread-count').expect(200);
      expect(unreadBefore.body.data.count).toBeGreaterThanOrEqual(1);

      const list = await authed(guardian.token).get('/api/v1/notifications').expect(200);
      expect(list.body.data.length).toBeGreaterThanOrEqual(1);
      expect(list.body.data[0].type).toBe('APPLICATION_RECEIVED');
      const notificationId = list.body.data[0].id as string;

      await authed(guardian.token).patch(`/api/v1/notifications/${notificationId}/read`).expect(200);
      const afterOneRead = await authed(guardian.token).get('/api/v1/notifications').expect(200);
      const marked = afterOneRead.body.data.find((n: { id: string }) => n.id === notificationId);
      expect(marked.readAt).not.toBeNull();

      await authed(guardian.token).patch('/api/v1/notifications/read-all').expect(200);
      const unreadAfter = await authed(guardian.token).get('/api/v1/notifications/unread-count').expect(200);
      expect(unreadAfter.body.data.count).toBe(0);
    });

    it('rejects marking a notification read for a different user', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      await authed(tutor.token).post(`/api/v1/listings/${listingId}/applications`).send({}).expect(201);

      const list = await authed(guardian.token).get('/api/v1/notifications').expect(200);
      const notificationId = list.body.data[0].id as string;

      const stranger = await registerAndLogin(['GUARDIAN']);
      await authed(stranger.token).patch(`/api/v1/notifications/${notificationId}/read`).expect(404);
    });
  });
});
