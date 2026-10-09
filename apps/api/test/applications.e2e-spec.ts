import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { uniqueEmail } from './test-utils';

const PASSWORD = 'StrongPassword123!';

describe('Applications and status management (e2e)', () => {
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
      data: { name: `Applications Spec University ${randomUUID()}`, normalizedName: randomUUID() },
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.application.deleteMany({ where: { listingId: { in: createdListingIds } } });
    await prisma.tuitionListing.deleteMany({ where: { id: { in: createdListingIds } } });
    await prisma.tutorProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.guardianProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.university.delete({ where: { id: university.id } });
    await app.close();
  });

  async function registerAndLogin(roles: string[]): Promise<{ token: string; userId: string }> {
    const email = uniqueEmail('applications-spec');
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
        fullName: 'Applications Spec Tutor',
        department: 'CSE',
        degreeProgram: 'BSc',
        academicStatus: 'CURRENT_STUDENT',
      })
      .expect(201);
    return res.body.data.id as string;
  }

  async function createPublishedListing(guardianUserId: string, overrides: { status?: string } = {}): Promise<string> {
    const listing = await prisma.tuitionListing.create({
      data: {
        guardianUserId,
        title: 'Applications Spec Listing',
        classLevel: 'Class 9',
        city: 'Dhaka',
        area: 'Dhanmondi',
        daysPerWeek: 3,
        status: (overrides.status as never) ?? 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
    createdListingIds.push(listing.id);
    return listing.id;
  }

  describe('applying to a listing', () => {
    it('rejects a GUARDIAN-only account from applying', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      await authed(guardian.token).post(`/api/v1/listings/${listingId}/applications`).send({}).expect(403);
    });

    it('rejects a TUTOR without a tutor profile yet', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      const tutor = await registerAndLogin(['TUTOR']);
      await authed(tutor.token).post(`/api/v1/listings/${listingId}/applications`).send({}).expect(400);
    });

    it('404s for a listing that is not PUBLISHED', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId, { status: 'DRAFT' });
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      await authed(tutor.token).post(`/api/v1/listings/${listingId}/applications`).send({}).expect(404);
    });

    it('rejects a guardian applying to their own listing even if they also hold TUTOR', async () => {
      const both = await registerAndLogin(['GUARDIAN', 'TUTOR']);
      await createTutorProfile(both.token);
      const listingId = await createPublishedListing(both.userId);
      await authed(both.token).post(`/api/v1/listings/${listingId}/applications`).send({}).expect(400);
    });

    it('creates an application and notifies the guardian', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);

      const res = await authed(tutor.token)
        .post(`/api/v1/listings/${listingId}/applications`)
        .send({ introduction: 'I would love to help with this.' })
        .expect(201);
      expect(res.body.data).toMatchObject({ status: 'SUBMITTED', listing: { id: listingId } });

      const notifications = await prisma.notification.findMany({ where: { userId: guardian.userId } });
      expect(notifications.some((n) => n.type === 'APPLICATION_RECEIVED')).toBe(true);
    });

    it('rejects a duplicate application with 409', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);

      await authed(tutor.token).post(`/api/v1/listings/${listingId}/applications`).send({}).expect(201);
      await authed(tutor.token).post(`/api/v1/listings/${listingId}/applications`).send({}).expect(409);
    });

    it('allows only one of two concurrent applications from the same tutor to succeed', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPublishedListing(guardian.userId);
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);

      const results = await Promise.all([
        authed(tutor.token).post(`/api/v1/listings/${listingId}/applications`).send({}),
        authed(tutor.token).post(`/api/v1/listings/${listingId}/applications`).send({}),
      ]);
      const statuses = results.map((r) => r.status).sort();
      expect(statuses).toEqual([201, 409]);

      const count = await prisma.application.count({ where: { listingId } });
      expect(count).toBe(1);
    });
  });

  describe('listing owner review and status transitions', () => {
    let guardian: { token: string; userId: string };
    let tutor: { token: string; userId: string };
    let listingId: string;
    let applicationId: string;

    beforeAll(async () => {
      guardian = await registerAndLogin(['GUARDIAN']);
      tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      listingId = await createPublishedListing(guardian.userId);

      const res = await authed(tutor.token).post(`/api/v1/listings/${listingId}/applications`).send({}).expect(201);
      applicationId = res.body.data.id as string;
    });

    it('rejects a non-owner from listing applicants', async () => {
      const otherGuardian = await registerAndLogin(['GUARDIAN']);
      await authed(otherGuardian.token).get(`/api/v1/listings/${listingId}/applications`).expect(404);
    });

    it('lets the owner see the applicant', async () => {
      const res = await authed(guardian.token).get(`/api/v1/listings/${listingId}/applications`).expect(200);
      expect(res.body.data.map((a: { id: string }) => a.id)).toContain(applicationId);
    });

    it('lets the applicant and the owner reach the detail endpoint, but no one else', async () => {
      await authed(tutor.token).get(`/api/v1/applications/${applicationId}`).expect(200);
      await authed(guardian.token).get(`/api/v1/applications/${applicationId}`).expect(200);

      const stranger = await registerAndLogin(['TUTOR']);
      await authed(stranger.token).get(`/api/v1/applications/${applicationId}`).expect(404);
    });

    it('rejects an invalid transition straight to ACCEPTED', async () => {
      await authed(guardian.token)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .send({ status: 'ACCEPTED' })
        .expect(400);
    });

    it('rejects the applicant from updating the status directly', async () => {
      await authed(tutor.token)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .send({ status: 'SHORTLISTED' })
        .expect(403);
    });

    it('shortlists, then accepts, and notifies the tutor each time', async () => {
      const shortlisted = await authed(guardian.token)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .send({ status: 'SHORTLISTED' })
        .expect(200);
      expect(shortlisted.body.data.status).toBe('SHORTLISTED');

      const accepted = await authed(guardian.token)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .send({ status: 'ACCEPTED' })
        .expect(200);
      expect(accepted.body.data.status).toBe('ACCEPTED');

      const notifications = await prisma.notification.findMany({
        where: { userId: tutor.userId, type: 'APPLICATION_UPDATED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects withdrawing an already-accepted application', async () => {
      await authed(tutor.token).patch(`/api/v1/applications/${applicationId}/withdraw`).expect(400);
    });
  });

  describe('withdrawal', () => {
    it('lets the applicant withdraw their own application, and rejects withdrawing twice', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const listingId = await createPublishedListing(guardian.userId);

      const created = await authed(tutor.token)
        .post(`/api/v1/listings/${listingId}/applications`)
        .send({})
        .expect(201);
      const applicationId = created.body.data.id as string;

      const withdrawn = await authed(tutor.token)
        .patch(`/api/v1/applications/${applicationId}/withdraw`)
        .expect(200);
      expect(withdrawn.body.data.status).toBe('WITHDRAWN');

      await authed(tutor.token).patch(`/api/v1/applications/${applicationId}/withdraw`).expect(400);
    });

    it('rejects a non-applicant from withdrawing', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const listingId = await createPublishedListing(guardian.userId);

      const created = await authed(tutor.token)
        .post(`/api/v1/listings/${listingId}/applications`)
        .send({})
        .expect(201);
      const applicationId = created.body.data.id as string;

      const otherTutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(otherTutor.token);
      await authed(otherTutor.token).patch(`/api/v1/applications/${applicationId}/withdraw`).expect(404);
    });
  });

  describe("tutor's own application history", () => {
    it('lists applications for the authenticated tutor only', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const listingId = await createPublishedListing(guardian.userId);

      const created = await authed(tutor.token)
        .post(`/api/v1/listings/${listingId}/applications`)
        .send({})
        .expect(201);

      const mine = await authed(tutor.token).get('/api/v1/users/me/applications').expect(200);
      expect(mine.body.data.map((a: { id: string }) => a.id)).toContain(created.body.data.id);

      const otherTutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(otherTutor.token);
      const theirs = await authed(otherTutor.token).get('/api/v1/users/me/applications').expect(200);
      expect(theirs.body.data.map((a: { id: string }) => a.id)).not.toContain(created.body.data.id);
    });
  });
});
