import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { uniqueEmail } from './test-utils';

const PASSWORD = 'StrongPassword123!';

describe('Tutor profile onboarding (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  let university: { id: string };
  let inactiveUniversity: { id: string };
  let subjectA: { id: string };
  let subjectB: { id: string };
  let inactiveSubject: { id: string };
  let curriculum: { id: string; name: string };

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
      data: { name: `Onboarding Spec University ${randomUUID()}`, normalizedName: randomUUID() },
    });
    inactiveUniversity = await prisma.university.create({
      data: {
        name: `Onboarding Spec Inactive University ${randomUUID()}`,
        normalizedName: randomUUID(),
        isActive: false,
      },
    });
    subjectA = await prisma.subject.create({
      data: { name: `Onboarding Spec Subject A ${randomUUID()}`, normalizedName: randomUUID() },
    });
    subjectB = await prisma.subject.create({
      data: { name: `Onboarding Spec Subject B ${randomUUID()}`, normalizedName: randomUUID() },
    });
    inactiveSubject = await prisma.subject.create({
      data: {
        name: `Onboarding Spec Inactive Subject ${randomUUID()}`,
        normalizedName: randomUUID(),
        isActive: false,
      },
    });
    curriculum = await prisma.curriculum.create({
      data: { name: `Onboarding Spec Curriculum ${randomUUID()}`, normalizedName: randomUUID() },
    });
  });

  afterAll(async () => {
    await prisma.tutorProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.university.deleteMany({ where: { id: { in: [university.id, inactiveUniversity.id] } } });
    await prisma.subject.deleteMany({
      where: { id: { in: [subjectA.id, subjectB.id, inactiveSubject.id] } },
    });
    await prisma.curriculum.delete({ where: { id: curriculum.id } });
    await app.close();
  });

  async function registerAndLogin(roles: string[]): Promise<string> {
    const email = uniqueEmail('tutor-onboarding-spec');
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
      put: (url: string) => request(app.getHttpServer()).put(url).set('Authorization', `Bearer ${token}`),
    };
  }

  const minimalProfile = () => ({
    universityId: university.id,
    fullName: 'Test Tutor',
    department: 'Computer Science',
    degreeProgram: 'BSc',
    academicStatus: 'CURRENT_STUDENT',
  });

  it('rejects a GUARDIAN-only account from every tutor profile route', async () => {
    const token = await registerAndLogin(['GUARDIAN']);
    await authed(token).post('/api/v1/tutors/me/profile').send(minimalProfile()).expect(403);
    await authed(token).get('/api/v1/tutors/me/profile').expect(403);
  });

  it('404s GET before a profile exists', async () => {
    const token = await registerAndLogin(['TUTOR']);
    await authed(token).get('/api/v1/tutors/me/profile').expect(404);
  });

  it('404s a PUT list endpoint before a profile exists', async () => {
    const token = await registerAndLogin(['TUTOR']);
    await authed(token)
      .put('/api/v1/tutors/me/subjects')
      .send({ subjectIds: [subjectA.id] })
      .expect(404);
  });

  it('rejects creation with an inactive university', async () => {
    const token = await registerAndLogin(['TUTOR']);
    await authed(token)
      .post('/api/v1/tutors/me/profile')
      .send({ ...minimalProfile(), universityId: inactiveUniversity.id })
      .expect(400);
  });

  it('rejects a fee range where the minimum exceeds the maximum', async () => {
    const token = await registerAndLogin(['TUTOR']);
    await authed(token)
      .post('/api/v1/tutors/me/profile')
      .send({ ...minimalProfile(), preferredFeeMin: 6000, preferredFeeMax: 4000 })
      .expect(400);
  });

  it('rejects an unknown field (forbidNonWhitelisted)', async () => {
    const token = await registerAndLogin(['TUTOR']);
    await authed(token)
      .post('/api/v1/tutors/me/profile')
      .send({ ...minimalProfile(), isVerified: true })
      .expect(400);
  });

  describe('full onboarding flow for one tutor', () => {
    let token: string;

    beforeAll(async () => {
      token = await registerAndLogin(['TUTOR']);
    });

    it('creates the profile (Stage B)', async () => {
      const res = await authed(token)
        .post('/api/v1/tutors/me/profile')
        .send({ ...minimalProfile(), preferredFeeMin: 4000, preferredFeeMax: 6000 })
        .expect(201);

      expect(res.body.data).toMatchObject({
        fullName: 'Test Tutor',
        university: { id: university.id },
        academicStatus: 'CURRENT_STUDENT',
      });
    });

    it('rejects creating a second profile for the same account', async () => {
      await authed(token).post('/api/v1/tutors/me/profile').send(minimalProfile()).expect(409);
    });

    it('retrieves the own profile', async () => {
      const res = await authed(token).get('/api/v1/tutors/me/profile').expect(200);
      expect(res.body.data.fullName).toBe('Test Tutor');
    });

    it('updates fields via PATCH', async () => {
      const res = await authed(token)
        .patch('/api/v1/tutors/me/profile')
        .send({ introduction: 'I love teaching mathematics.' })
        .expect(200);
      expect(res.body.data.introduction).toBe('I love teaching mathematics.');
    });

    it('rejects subjectIds that are not UUIDs or are duplicated', async () => {
      await authed(token)
        .put('/api/v1/tutors/me/subjects')
        .send({ subjectIds: ['not-a-uuid'] })
        .expect(400);
      await authed(token)
        .put('/api/v1/tutors/me/subjects')
        .send({ subjectIds: [subjectA.id, subjectA.id] })
        .expect(400);
    });

    it('rejects an inactive subject reference', async () => {
      await authed(token)
        .put('/api/v1/tutors/me/subjects')
        .send({ subjectIds: [subjectA.id, inactiveSubject.id] })
        .expect(400);
    });

    it('replaces subjects (Stage C)', async () => {
      const res = await authed(token)
        .put('/api/v1/tutors/me/subjects')
        .send({ subjectIds: [subjectA.id, subjectB.id] })
        .expect(200);
      expect(res.body.data.subjects.map((s: { id: string }) => s.id).sort()).toEqual(
        [subjectA.id, subjectB.id].sort(),
      );

      // Replacing again with a subset must remove what's no longer listed.
      const second = await authed(token)
        .put('/api/v1/tutors/me/subjects')
        .send({ subjectIds: [subjectA.id] })
        .expect(200);
      expect(second.body.data.subjects.map((s: { id: string }) => s.id)).toEqual([subjectA.id]);
    });

    it('rejects an unapproved grade level', async () => {
      await authed(token)
        .put('/api/v1/tutors/me/grades')
        .send({ gradeLevels: ['Class 99'] })
        .expect(400);
    });

    it('replaces grades (Stage C)', async () => {
      const res = await authed(token)
        .put('/api/v1/tutors/me/grades')
        .send({ gradeLevels: ['Class 9', 'Class 10'] })
        .expect(200);
      expect(res.body.data.grades.sort()).toEqual(['Class 10', 'Class 9']);
    });

    it('replaces curricula (Stage C)', async () => {
      const res = await authed(token)
        .put('/api/v1/tutors/me/curricula')
        .send({ curriculumIds: [curriculum.id] })
        .expect(200);
      expect(res.body.data.curricula).toEqual([{ id: curriculum.id, name: curriculum.name }]);
    });

    it('replaces locations (Stage D)', async () => {
      const res = await authed(token)
        .put('/api/v1/tutors/me/locations')
        .send({ locations: [{ city: 'Dhaka', area: 'Dhanmondi' }] })
        .expect(200);
      expect(res.body.data.locations).toEqual([
        { city: 'Dhaka', area: 'Dhanmondi', neighborhood: null },
      ]);
    });

    it('rejects an availability slot where startTime is not before endTime', async () => {
      await authed(token)
        .put('/api/v1/tutors/me/availability')
        .send({ slots: [{ day: 'SATURDAY', startTime: '18:00', endTime: '17:00' }] })
        .expect(400);
    });

    it('rejects a malformed time string', async () => {
      await authed(token)
        .put('/api/v1/tutors/me/availability')
        .send({ slots: [{ day: 'SATURDAY', startTime: '5pm', endTime: '18:00' }] })
        .expect(400);
    });

    it('replaces availability (Stage D) and converts HH:mm to minutes correctly', async () => {
      const res = await authed(token)
        .put('/api/v1/tutors/me/availability')
        .send({ slots: [{ day: 'SATURDAY', startTime: '17:00', endTime: '19:00' }] })
        .expect(200);
      expect(res.body.data.availability).toEqual([
        { day: 'SATURDAY', startMinute: 17 * 60, endMinute: 19 * 60 },
      ]);
    });

    it('is now visible in the public search and detail endpoints (Phase 5 integration)', async () => {
      const search = await request(app.getHttpServer())
        .get(`/api/v1/tutors?subjectId=${subjectA.id}`)
        .expect(200);
      const profileId = search.body.data[0]?.id;
      expect(profileId).toBeDefined();

      const detail = await request(app.getHttpServer()).get(`/api/v1/tutors/${profileId}`).expect(200);
      expect(detail.body.data).toMatchObject({
        fullName: 'Test Tutor',
        introduction: 'I love teaching mathematics.',
        locations: [{ city: 'Dhaka', area: 'Dhanmondi', neighborhood: null }],
      });
    });

    it('toggling isAvailable off hides it from public search again', async () => {
      await authed(token).patch('/api/v1/tutors/me/profile').send({ isAvailable: false }).expect(200);

      const search = await request(app.getHttpServer())
        .get(`/api/v1/tutors?subjectId=${subjectA.id}`)
        .expect(200);
      expect(search.body.data).toEqual([]);

      // The owner can still see their own profile regardless of availability.
      const own = await authed(token).get('/api/v1/tutors/me/profile').expect(200);
      expect(own.body.data.fullName).toBe('Test Tutor');
    });
  });
});
