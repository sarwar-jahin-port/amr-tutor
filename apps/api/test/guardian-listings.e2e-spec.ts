import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { uniqueEmail } from './test-utils';

const PASSWORD = 'StrongPassword123!';

describe('Guardian onboarding and listing creation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let subjectA: { id: string };
  let subjectB: { id: string };
  let inactiveSubject: { id: string };
  let curriculum: { id: string; name: string };
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

    subjectA = await prisma.subject.create({
      data: { name: `Listing Spec Subject A ${randomUUID()}`, normalizedName: randomUUID() },
    });
    subjectB = await prisma.subject.create({
      data: { name: `Listing Spec Subject B ${randomUUID()}`, normalizedName: randomUUID() },
    });
    inactiveSubject = await prisma.subject.create({
      data: { name: `Listing Spec Inactive Subject ${randomUUID()}`, normalizedName: randomUUID(), isActive: false },
    });
    curriculum = await prisma.curriculum.create({
      data: { name: `Listing Spec Curriculum ${randomUUID()}`, normalizedName: randomUUID() },
    });
    university = await prisma.university.create({
      data: { name: `Listing Spec University ${randomUUID()}`, normalizedName: randomUUID() },
    });
  });

  afterAll(async () => {
    await prisma.tuitionListing.deleteMany({ where: { guardianUserId: { in: createdUserIds } } });
    await prisma.guardianProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.subject.deleteMany({ where: { id: { in: [subjectA.id, subjectB.id, inactiveSubject.id] } } });
    await prisma.curriculum.delete({ where: { id: curriculum.id } });
    await prisma.university.delete({ where: { id: university.id } });
    await app.close();
  });

  async function registerAndLogin(roles: string[]): Promise<string> {
    const email = uniqueEmail('guardian-listing-spec');
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: PASSWORD, roles })
      .expect(201);
    createdUserIds.push(register.body.data.id);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return login.body.data.accessToken as string;
  }

  function authed(token: string) {
    return {
      post: (url: string) => request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`),
      get: (url: string) => request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`),
      patch: (url: string) => request(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${token}`),
    };
  }

  const minimalListing = () => ({
    title: 'Mathematics tutor for Class 9',
    classLevel: 'Class 9',
    subjectIds: [subjectA.id],
    city: 'Dhaka',
    area: 'Dhanmondi',
    daysPerWeek: 3,
  });

  describe('Guardian profile', () => {
    it('rejects a TUTOR-only account from every guardian profile route', async () => {
      const token = await registerAndLogin(['TUTOR']);
      await authed(token)
        .post('/api/v1/guardians/me/profile')
        .send({ displayName: 'Test Guardian' })
        .expect(403);
      await authed(token).get('/api/v1/guardians/me/profile').expect(403);
    });

    it('404s GET before a profile exists', async () => {
      const token = await registerAndLogin(['GUARDIAN']);
      await authed(token).get('/api/v1/guardians/me/profile').expect(404);
    });

    it('creates, retrieves, updates, and rejects a duplicate guardian profile', async () => {
      const token = await registerAndLogin(['GUARDIAN']);

      const created = await authed(token)
        .post('/api/v1/guardians/me/profile')
        .send({ displayName: 'Rahela Begum' })
        .expect(201);
      expect(created.body.data.displayName).toBe('Rahela Begum');

      await authed(token)
        .post('/api/v1/guardians/me/profile')
        .send({ displayName: 'Someone Else' })
        .expect(409);

      const fetched = await authed(token).get('/api/v1/guardians/me/profile').expect(200);
      expect(fetched.body.data.displayName).toBe('Rahela Begum');

      const updated = await authed(token)
        .patch('/api/v1/guardians/me/profile')
        .send({ displayName: 'Rahela Begum Chowdhury' })
        .expect(200);
      expect(updated.body.data.displayName).toBe('Rahela Begum Chowdhury');
    });
  });

  describe('Listing creation requires a guardian profile first', () => {
    it('rejects creating a listing before a guardian profile exists', async () => {
      const token = await registerAndLogin(['GUARDIAN']);
      await authed(token).post('/api/v1/listings').send(minimalListing()).expect(400);
    });

    it('rejects a TUTOR-only account from every listing-owner route', async () => {
      const token = await registerAndLogin(['TUTOR']);
      await authed(token).post('/api/v1/listings').send(minimalListing()).expect(403);
      await authed(token).get('/api/v1/users/me/listings').expect(403);
    });
  });

  describe('full listing lifecycle for one guardian', () => {
    let token: string;
    let listingId: string;

    beforeAll(async () => {
      token = await registerAndLogin(['GUARDIAN']);
      await authed(token).post('/api/v1/guardians/me/profile').send({ displayName: 'Guardian Spec' }).expect(201);
    });

    it('rejects creation with an inactive subject', async () => {
      await authed(token)
        .post('/api/v1/listings')
        .send({ ...minimalListing(), subjectIds: [inactiveSubject.id] })
        .expect(400);
    });

    it('rejects an unknown field (forbidNonWhitelisted)', async () => {
      await authed(token)
        .post('/api/v1/listings')
        .send({ ...minimalListing(), guardianUserId: randomUUID() })
        .expect(400);
    });

    it('creates a DRAFT listing (Basics step)', async () => {
      const res = await authed(token).post('/api/v1/listings').send(minimalListing()).expect(201);
      listingId = res.body.data.id;
      expect(res.body.data).toMatchObject({ title: minimalListing().title, status: 'DRAFT' });
    });

    it('lists it under the owner\'s own listings', async () => {
      const res = await authed(token).get('/api/v1/users/me/listings').expect(200);
      expect(res.body.data.map((l: { id: string }) => l.id)).toContain(listingId);
    });

    it('retrieves the owner detail view regardless of status', async () => {
      const res = await authed(token).get(`/api/v1/users/me/listings/${listingId}`).expect(200);
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('404s for a non-owner', async () => {
      const otherToken = await registerAndLogin(['GUARDIAN']);
      await authed(otherToken).get(`/api/v1/users/me/listings/${listingId}`).expect(404);
    });

    it('rejects an invalid curriculum or university preference', async () => {
      await authed(token)
        .patch(`/api/v1/users/me/listings/${listingId}`)
        .send({ curriculumId: randomUUID() })
        .expect(400);
      await authed(token)
        .patch(`/api/v1/users/me/listings/${listingId}`)
        .send({ universityPreferenceIds: [randomUUID()] })
        .expect(400);
    });

    it('rejects a schedule slot with only one of startTime/endTime', async () => {
      await authed(token)
        .patch(`/api/v1/users/me/listings/${listingId}`)
        .send({ schedules: [{ day: 'SUNDAY', startTime: '17:00' }] })
        .expect(400);
    });

    it('updates schedule, budget, and description (later wizard steps)', async () => {
      const res = await authed(token)
        .patch(`/api/v1/users/me/listings/${listingId}`)
        .send({
          schedules: [{ day: 'SUNDAY', startTime: '17:00', endTime: '18:00' }],
          salaryMin: 4000,
          salaryMax: 6000,
          curriculumId: curriculum.id,
          universityPreferenceIds: [university.id],
          description: 'Looking for a patient tutor for weekly algebra lessons.',
        })
        .expect(200);

      expect(res.body.data.schedules).toEqual([{ day: 'SUNDAY', startMinute: 17 * 60, endMinute: 18 * 60 }]);
      expect(res.body.data.curriculum).toEqual({ id: curriculum.id, name: curriculum.name });
    });

    it('rejects a salary range where the minimum exceeds the maximum', async () => {
      await authed(token)
        .patch(`/api/v1/users/me/listings/${listingId}`)
        .send({ salaryMin: 9000 })
        .expect(400);
    });

    it('stays invisible to the public Phase 5 search and detail endpoints while DRAFT', async () => {
      const search = await request(app.getHttpServer())
        .get(`/api/v1/listings?subjectId=${subjectA.id}`)
        .expect(200);
      expect(search.body.data.map((l: { id: string }) => l.id)).not.toContain(listingId);

      await request(app.getHttpServer()).get(`/api/v1/listings/${listingId}`).expect(404);
    });

    it('submits for review (DRAFT -> PENDING_REVIEW)', async () => {
      const res = await authed(token).post(`/api/v1/users/me/listings/${listingId}/submit`).expect(201);
      expect(res.body.data.status).toBe('PENDING_REVIEW');
    });

    it('rejects submitting again from PENDING_REVIEW', async () => {
      await authed(token).post(`/api/v1/users/me/listings/${listingId}/submit`).expect(400);
    });

    it('still stays invisible to the public search while PENDING_REVIEW', async () => {
      await request(app.getHttpServer()).get(`/api/v1/listings/${listingId}`).expect(404);
    });

    it('becomes publicly visible once PUBLISHED (simulating the Phase 11 admin decision)', async () => {
      // No admin endpoint exists yet (blueprint Phase 11 owns that) — flip
      // the row directly, the same way a future admin action would.
      await prisma.tuitionListing.update({
        where: { id: listingId },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });

      const search = await request(app.getHttpServer())
        .get(`/api/v1/listings?subjectId=${subjectA.id}`)
        .expect(200);
      expect(search.body.data.map((l: { id: string }) => l.id)).toContain(listingId);

      const detail = await request(app.getHttpServer()).get(`/api/v1/listings/${listingId}`).expect(200);
      expect(detail.body.data.title).toBe(minimalListing().title);
    });

    it('editing a published listing reverts it to PENDING_REVIEW', async () => {
      const res = await authed(token)
        .patch(`/api/v1/users/me/listings/${listingId}`)
        .send({ description: 'Updated description after going live.' })
        .expect(200);
      expect(res.body.data.status).toBe('PENDING_REVIEW');

      await request(app.getHttpServer()).get(`/api/v1/listings/${listingId}`).expect(404);
    });

    it('closes the listing, idempotently', async () => {
      const first = await authed(token).post(`/api/v1/users/me/listings/${listingId}/close`).expect(201);
      expect(first.body.data.status).toBe('CLOSED');

      const second = await authed(token).post(`/api/v1/users/me/listings/${listingId}/close`).expect(201);
      expect(second.body.data.status).toBe('CLOSED');
    });

    it('rejects submitting a closed listing', async () => {
      await authed(token).post(`/api/v1/users/me/listings/${listingId}/submit`).expect(400);
    });
  });
});
