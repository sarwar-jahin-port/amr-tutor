import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { uniqueEmail } from './test-utils';

describe('Public browsing and reference data (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let university: { id: string; name: string };
  let subject: { id: string; name: string };
  let curriculum: { id: string; name: string };

  let availableTutorUserId: string;
  let availableTutorProfileId: string;
  let unavailableTutorProfileId: string;
  let suspendedTutorUserId: string;
  let suspendedTutorProfileId: string;

  let guardianUserId: string;
  let publishedListingId: string;
  let draftListingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    university = await prisma.university.create({
      data: { name: `Public Browsing Spec University ${randomUUID()}`, normalizedName: randomUUID() },
    });
    subject = await prisma.subject.create({
      data: { name: `Public Browsing Spec Subject ${randomUUID()}`, normalizedName: randomUUID() },
    });
    curriculum = await prisma.curriculum.create({
      data: { name: `Public Browsing Spec Curriculum ${randomUUID()}`, normalizedName: randomUUID() },
    });

    // An available tutor from an active account — must appear in search/detail.
    const availableTutorUser = await prisma.user.create({
      data: { email: uniqueEmail('public-tutor-available'), passwordHash: 'x' },
    });
    availableTutorUserId = availableTutorUser.id;
    const availableTutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: availableTutorUserId,
        universityId: university.id,
        fullName: 'Available Tutor',
        department: 'CSE',
        degreeProgram: 'BSc',
        academicStatus: 'CURRENT_STUDENT',
        isAvailable: true,
        subjects: { create: [{ subjectId: subject.id }] },
        locations: { create: [{ city: 'Dhaka', area: 'Dhanmondi' }] },
      },
    });
    availableTutorProfileId = availableTutorProfile.id;

    // A tutor who toggled availability off — must be excluded from both.
    const unavailableTutorUser = await prisma.user.create({
      data: { email: uniqueEmail('public-tutor-unavailable'), passwordHash: 'x' },
    });
    const unavailableTutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: unavailableTutorUser.id,
        universityId: university.id,
        fullName: 'Unavailable Tutor',
        department: 'CSE',
        degreeProgram: 'BSc',
        academicStatus: 'CURRENT_STUDENT',
        isAvailable: false,
      },
    });
    unavailableTutorProfileId = unavailableTutorProfile.id;

    // An available tutor whose account is suspended — must be excluded.
    const suspendedTutorUser = await prisma.user.create({
      data: { email: uniqueEmail('public-tutor-suspended'), passwordHash: 'x', status: 'SUSPENDED' },
    });
    suspendedTutorUserId = suspendedTutorUser.id;
    const suspendedTutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: suspendedTutorUserId,
        universityId: university.id,
        fullName: 'Suspended Tutor',
        department: 'CSE',
        degreeProgram: 'BSc',
        academicStatus: 'CURRENT_STUDENT',
        isAvailable: true,
      },
    });
    suspendedTutorProfileId = suspendedTutorProfile.id;

    const guardianUser = await prisma.user.create({
      data: { email: uniqueEmail('public-listing-owner'), passwordHash: 'x' },
    });
    guardianUserId = guardianUser.id;

    const publishedListing = await prisma.tuitionListing.create({
      data: {
        guardianUserId,
        title: 'Published Math tuition for spec',
        classLevel: 'Class 9',
        city: 'Dhaka',
        area: 'Dhanmondi',
        daysPerWeek: 3,
        salaryMin: 4000,
        salaryMax: 6000,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        curriculumId: curriculum.id,
        subjects: { create: [{ subjectId: subject.id }] },
      },
    });
    publishedListingId = publishedListing.id;

    const draftListing = await prisma.tuitionListing.create({
      data: {
        guardianUserId,
        title: 'Draft listing that must stay hidden',
        classLevel: 'Class 9',
        city: 'Dhaka',
        area: 'Dhanmondi',
        daysPerWeek: 3,
        status: 'DRAFT',
      },
    });
    draftListingId = draftListing.id;
  });

  afterAll(async () => {
    await prisma.tuitionListing.deleteMany({
      where: { id: { in: [publishedListingId, draftListingId] } },
    });
    await prisma.tutorProfile.deleteMany({
      where: {
        id: { in: [availableTutorProfileId, unavailableTutorProfileId, suspendedTutorProfileId] },
      },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [availableTutorUserId, suspendedTutorUserId, guardianUserId] } },
    });
    // unavailableTutorUser wasn't captured by a named var above; sweep by email prefix instead.
    await prisma.user.deleteMany({ where: { email: { contains: 'public-tutor-unavailable' } } });
    await prisma.university.delete({ where: { id: university.id } });
    await prisma.subject.delete({ where: { id: subject.id } });
    await prisma.curriculum.delete({ where: { id: curriculum.id } });
    await app.close();
  });

  describe('GET /references/*', () => {
    it('lists universities with pagination metadata', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/references/universities?limit=5')
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 5 });
      expect(res.body.meta.total).toBeGreaterThanOrEqual(res.body.data.length);
    });

    it('filters subjects by search term', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/references/subjects?search=${encodeURIComponent(subject.name)}`)
        .expect(200);

      expect(res.body.data).toEqual([{ id: subject.id, name: subject.name }]);
    });

    it('rejects a limit above the allowed maximum', async () => {
      await request(app.getHttpServer()).get('/api/v1/references/subjects?limit=500').expect(400);
    });

    it('serves the static grade list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/references/grades?limit=100')
        .expect(200);

      expect(res.body.data.map((g: { name: string }) => g.name)).toContain('Class 9');
    });

    it('serves the static division/district hierarchy with Dhaka as default', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/references/locations').expect(200);

      const dhaka = res.body.data.find((d: { id: string }) => d.id === 'dhaka');
      expect(dhaka.isDefault).toBe(true);
      expect(dhaka.districts.length).toBeGreaterThan(0);
    });
  });

  describe('GET /tutors', () => {
    it('only returns available tutors from active accounts', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tutors?universityId=${university.id}`)
        .expect(200);

      const ids = res.body.data.map((t: { id: string }) => t.id);
      expect(ids).toContain(availableTutorProfileId);
      expect(ids).not.toContain(unavailableTutorProfileId);
      expect(ids).not.toContain(suspendedTutorProfileId);
    });

    it('filters by subject', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tutors?subjectId=${subject.id}`)
        .expect(200);

      expect(res.body.data.map((t: { id: string }) => t.id)).toEqual([availableTutorProfileId]);
    });

    it('never exposes a raw private field regardless of query tampering', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tutors?universityId=${university.id}`)
        .expect(200);

      const match = res.body.data.find((t: { id: string }) => t.id === availableTutorProfileId);
      expect(match).not.toHaveProperty('userId');
      expect(match).not.toHaveProperty('profilePhotoKey');
    });

    it('rejects an unknown filter field', async () => {
      await request(app.getHttpServer()).get('/api/v1/tutors?isVerified=true').expect(400);
    });
  });

  describe('GET /tutors/:id', () => {
    it('returns the full public profile for an available tutor', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tutors/${availableTutorProfileId}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: availableTutorProfileId,
        fullName: 'Available Tutor',
        university: { id: university.id },
      });
      expect(res.body.data).not.toHaveProperty('userId');
    });

    it('404s for an unavailable tutor', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tutors/${unavailableTutorProfileId}`)
        .expect(404);
    });

    it('404s for a suspended account', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/tutors/${suspendedTutorProfileId}`)
        .expect(404);
    });

    it('rejects a non-UUID id', async () => {
      await request(app.getHttpServer()).get('/api/v1/tutors/not-a-uuid').expect(400);
    });
  });

  describe('GET /listings', () => {
    it('only returns published listings', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/listings?subjectId=${subject.id}`)
        .expect(200);

      const ids = res.body.data.map((l: { id: string }) => l.id);
      expect(ids).toContain(publishedListingId);
      expect(ids).not.toContain(draftListingId);
    });

    it('never exposes the guardian owner', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/listings?subjectId=${subject.id}`)
        .expect(200);

      const match = res.body.data.find((l: { id: string }) => l.id === publishedListingId);
      expect(match).not.toHaveProperty('guardianUserId');
    });

    it('filters by salary range overlap', async () => {
      const withinRange = await request(app.getHttpServer())
        .get('/api/v1/listings?salaryMin=3000&salaryMax=7000')
        .expect(200);
      expect(withinRange.body.data.map((l: { id: string }) => l.id)).toContain(publishedListingId);

      const outOfRange = await request(app.getHttpServer())
        .get('/api/v1/listings?salaryMin=10000')
        .expect(200);
      expect(outOfRange.body.data.map((l: { id: string }) => l.id)).not.toContain(publishedListingId);
    });
  });

  describe('GET /listings/:id', () => {
    it('returns the full public detail for a published listing', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/listings/${publishedListingId}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: publishedListingId,
        title: 'Published Math tuition for spec',
        curriculum: { id: curriculum.id },
      });
      expect(res.body.data).not.toHaveProperty('guardianUserId');
    });

    it('404s for a draft listing', async () => {
      await request(app.getHttpServer()).get(`/api/v1/listings/${draftListingId}`).expect(404);
    });
  });
});
