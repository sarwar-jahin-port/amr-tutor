import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { uniqueEmail } from './test-utils';

const PASSWORD = 'StrongPassword123!';

const VALID_JPEG_BYTES = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0xff, 0xd9,
]);
const NOT_A_JPEG_BYTES = Buffer.from('this is definitely not a jpeg file');

describe('Student verification (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

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
      data: { name: `Verification Spec University ${randomUUID()}`, normalizedName: randomUUID() },
    });
  });

  afterAll(async () => {
    await prisma.verificationEvidence.deleteMany({
      where: { verificationRequest: { tutorProfile: { userId: { in: createdUserIds } } } },
    });
    await prisma.verificationRequest.deleteMany({ where: { tutorProfile: { userId: { in: createdUserIds } } } });
    await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.tutorProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.university.delete({ where: { id: university.id } });
    await app.close();
  });

  async function registerAndLogin(roles: string[]): Promise<{ token: string; userId: string }> {
    const email = uniqueEmail('verification-spec');
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

  /** No self-registration path grants VERIFIER/ADMIN — simulate the Phase 11 admin role-grant directly, same as other specs simulate not-yet-built admin actions. */
  async function grantRole(userId: string, role: 'VERIFIER' | 'ADMIN'): Promise<void> {
    await prisma.userRole.create({ data: { userId, role } });
  }

  function authed(token: string) {
    return {
      post: (url: string) => request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`),
      get: (url: string) => request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`),
    };
  }

  async function createTutorProfile(token: string): Promise<string> {
    const res = await authed(token)
      .post('/api/v1/tutors/me/profile')
      .send({
        universityId: university.id,
        fullName: 'Verification Spec Tutor',
        department: 'CSE',
        degreeProgram: 'BSc',
        academicStatus: 'CURRENT_STUDENT',
      })
      .expect(201);
    return res.body.data.id as string;
  }

  async function uploadEvidence(
    token: string,
    requestId: string,
    bytes: Buffer,
    contentType = 'image/jpeg',
  ): Promise<string> {
    const res = await authed(token)
      .post(`/api/v1/verifications/${requestId}/evidence-upload`)
      .send({ evidenceType: 'STUDENT_ID', contentType, fileSizeBytes: bytes.length, originalFileName: 'id.jpg' })
      .expect(201);

    const uploadRes = await fetch(res.body.data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: bytes,
    });
    expect(uploadRes.status).toBe(200);

    return res.body.data.evidenceId as string;
  }

  describe('creating a request', () => {
    it('rejects a user without a tutor profile', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await authed(tutor.token).post('/api/v1/verifications').send({ type: 'UNIVERSITY_AFFILIATION' }).expect(400);
    });

    it('creates a PENDING request and rejects a duplicate active one of the same type', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);

      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);
      expect(created.body.data.status).toBe('PENDING');

      await authed(tutor.token).post('/api/v1/verifications').send({ type: 'UNIVERSITY_AFFILIATION' }).expect(409);
    });

    it('404s the detail endpoint for a stranger, and lists it under /verifications/me', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'ACADEMIC_CREDENTIAL' })
        .expect(201);

      const stranger = await registerAndLogin(['TUTOR']);
      await authed(stranger.token).get(`/api/v1/verifications/${created.body.data.id}`).expect(404);

      const mine = await authed(tutor.token).get('/api/v1/verifications/me').expect(200);
      expect(mine.body.data.map((r: { id: string }) => r.id)).toContain(created.body.data.id);
    });
  });

  describe('evidence and submission', () => {
    it('rejects submitting with no evidence attached', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);

      await authed(tutor.token).post(`/api/v1/verifications/${created.body.data.id}/submit`).expect(400);
    });

    it('rejects a declared JPEG whose actual bytes are not a JPEG, independent of the declared content type', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);

      await uploadEvidence(tutor.token, created.body.data.id, NOT_A_JPEG_BYTES);

      await authed(tutor.token).post(`/api/v1/verifications/${created.body.data.id}/submit`).expect(400);
    });

    it('submits successfully with valid evidence, moving PENDING -> IN_REVIEW', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);

      await uploadEvidence(tutor.token, created.body.data.id, VALID_JPEG_BYTES);

      const submitted = await authed(tutor.token)
        .post(`/api/v1/verifications/${created.body.data.id}/submit`)
        .expect(201);
      expect(submitted.body.data.status).toBe('IN_REVIEW');
      expect(submitted.body.data.evidence).toHaveLength(1);
    });

    it('rejects a non-tutor/non-reviewer stranger from requesting an upload URL', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);

      const stranger = await registerAndLogin(['TUTOR']);
      await authed(stranger.token)
        .post(`/api/v1/verifications/${created.body.data.id}/evidence-upload`)
        .send({ evidenceType: 'STUDENT_ID', contentType: 'image/jpeg', fileSizeBytes: 1024 })
        .expect(404);
    });
  });

  describe('reviewer queue and decisions', () => {
    it('rejects a TUTOR-only account from the admin queue', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await authed(tutor.token).get('/api/v1/admin/verifications').expect(403);
    });

    it('lists IN_REVIEW requests in the queue and lets an unassigned VERIFIER decide', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);
      await uploadEvidence(tutor.token, created.body.data.id, VALID_JPEG_BYTES);
      await authed(tutor.token).post(`/api/v1/verifications/${created.body.data.id}/submit`).expect(201);

      const reviewer = await registerAndLogin(['TUTOR']);
      await grantRole(reviewer.userId, 'VERIFIER');

      const queue = await authed(reviewer.token).get('/api/v1/admin/verifications').expect(200);
      expect(queue.body.data.map((r: { id: string }) => r.id)).toContain(created.body.data.id);

      const approved = await authed(reviewer.token)
        .post(`/api/v1/admin/verifications/${created.body.data.id}/decision`)
        .send({ decision: 'APPROVE' })
        .expect(201);
      expect(approved.body.data.status).toBe('APPROVED');

      const notifications = await prisma.notification.findMany({
        where: { userId: tutor.userId, type: 'VERIFICATION_UPDATED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    it('rejects a reason-less REJECT, and requires evidence to be re-submitted after REQUEST_MORE_INFO', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);
      await uploadEvidence(tutor.token, created.body.data.id, VALID_JPEG_BYTES);
      await authed(tutor.token).post(`/api/v1/verifications/${created.body.data.id}/submit`).expect(201);

      const reviewer = await registerAndLogin(['TUTOR']);
      await grantRole(reviewer.userId, 'VERIFIER');

      await authed(reviewer.token)
        .post(`/api/v1/admin/verifications/${created.body.data.id}/decision`)
        .send({ decision: 'REJECT' })
        .expect(400);

      const needsInfo = await authed(reviewer.token)
        .post(`/api/v1/admin/verifications/${created.body.data.id}/decision`)
        .send({ decision: 'REQUEST_MORE_INFO', reason: 'Photo is too blurry to read.' })
        .expect(201);
      expect(needsInfo.body.data.status).toBe('NEEDS_INFORMATION');

      // Back in the applicant's hands: more evidence, then re-submit.
      await uploadEvidence(tutor.token, created.body.data.id, VALID_JPEG_BYTES);
      const resubmitted = await authed(tutor.token)
        .post(`/api/v1/verifications/${created.body.data.id}/submit`)
        .expect(201);
      expect(resubmitted.body.data.status).toBe('IN_REVIEW');
    });

    it('prevents a second VERIFIER from deciding a request already claimed by another', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);
      await uploadEvidence(tutor.token, created.body.data.id, VALID_JPEG_BYTES);
      await authed(tutor.token).post(`/api/v1/verifications/${created.body.data.id}/submit`).expect(201);

      const reviewerA = await registerAndLogin(['TUTOR']);
      await grantRole(reviewerA.userId, 'VERIFIER');
      const reviewerB = await registerAndLogin(['TUTOR']);
      await grantRole(reviewerB.userId, 'VERIFIER');

      await authed(reviewerA.token)
        .post(`/api/v1/admin/verifications/${created.body.data.id}/decision`)
        .send({ decision: 'REQUEST_MORE_INFO', reason: 'Need a clearer photo.' })
        .expect(201);

      await uploadEvidence(tutor.token, created.body.data.id, VALID_JPEG_BYTES);
      await authed(tutor.token).post(`/api/v1/verifications/${created.body.data.id}/submit`).expect(201);

      // reviewerA claimed it on the first decision; reviewerB is a different, unassigned-to-them case now.
      await authed(reviewerB.token)
        .post(`/api/v1/admin/verifications/${created.body.data.id}/decision`)
        .send({ decision: 'APPROVE' })
        .expect(403);

      const approved = await authed(reviewerA.token)
        .post(`/api/v1/admin/verifications/${created.body.data.id}/decision`)
        .send({ decision: 'APPROVE' })
        .expect(201);
      expect(approved.body.data.status).toBe('APPROVED');
    });

    it('lets an ADMIN decide a request assigned to a different VERIFIER', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);
      await uploadEvidence(tutor.token, created.body.data.id, VALID_JPEG_BYTES);
      await authed(tutor.token).post(`/api/v1/verifications/${created.body.data.id}/submit`).expect(201);

      const verifier = await registerAndLogin(['TUTOR']);
      await grantRole(verifier.userId, 'VERIFIER');
      await authed(verifier.token)
        .post(`/api/v1/admin/verifications/${created.body.data.id}/decision`)
        .send({ decision: 'REQUEST_MORE_INFO', reason: 'Need another document.' })
        .expect(201);

      await uploadEvidence(tutor.token, created.body.data.id, VALID_JPEG_BYTES);
      await authed(tutor.token).post(`/api/v1/verifications/${created.body.data.id}/submit`).expect(201);

      const admin = await registerAndLogin(['TUTOR']);
      await grantRole(admin.userId, 'ADMIN');
      const decided = await authed(admin.token)
        .post(`/api/v1/admin/verifications/${created.body.data.id}/decision`)
        .send({ decision: 'APPROVE' })
        .expect(201);
      expect(decided.body.data.status).toBe('APPROVED');
    });

    it('prevents a reviewer from approving their own verification request', async () => {
      const tutorReviewer = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutorReviewer.token);
      await grantRole(tutorReviewer.userId, 'ADMIN');

      const created = await authed(tutorReviewer.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);
      await uploadEvidence(tutorReviewer.token, created.body.data.id, VALID_JPEG_BYTES);
      await authed(tutorReviewer.token).post(`/api/v1/verifications/${created.body.data.id}/submit`).expect(201);

      await authed(tutorReviewer.token)
        .post(`/api/v1/admin/verifications/${created.body.data.id}/decision`)
        .send({ decision: 'APPROVE' })
        .expect(403);
    });
  });

  describe('evidence download authorization', () => {
    it('allows the owner and an assigned reviewer, but rejects a stranger', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await createTutorProfile(tutor.token);
      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);
      const evidenceId = await uploadEvidence(tutor.token, created.body.data.id, VALID_JPEG_BYTES);

      await authed(tutor.token)
        .get(`/api/v1/verifications/${created.body.data.id}/evidence/${evidenceId}/download-url`)
        .expect(200);

      const reviewer = await registerAndLogin(['TUTOR']);
      await grantRole(reviewer.userId, 'VERIFIER');
      await authed(reviewer.token)
        .get(`/api/v1/verifications/${created.body.data.id}/evidence/${evidenceId}/download-url`)
        .expect(200);

      const stranger = await registerAndLogin(['TUTOR']);
      await authed(stranger.token)
        .get(`/api/v1/verifications/${created.body.data.id}/evidence/${evidenceId}/download-url`)
        .expect(404);
    });
  });

  describe('public verification badge', () => {
    it('shows isVerified only once a request has been approved', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      const tutorProfileId = await createTutorProfile(tutor.token);

      const before = await request(app.getHttpServer()).get(`/api/v1/tutors/${tutorProfileId}`).expect(200);
      expect(before.body.data.isVerified).toBe(false);

      const created = await authed(tutor.token)
        .post('/api/v1/verifications')
        .send({ type: 'UNIVERSITY_AFFILIATION' })
        .expect(201);
      await uploadEvidence(tutor.token, created.body.data.id, VALID_JPEG_BYTES);
      await authed(tutor.token).post(`/api/v1/verifications/${created.body.data.id}/submit`).expect(201);

      const reviewer = await registerAndLogin(['TUTOR']);
      await grantRole(reviewer.userId, 'VERIFIER');
      await authed(reviewer.token)
        .post(`/api/v1/admin/verifications/${created.body.data.id}/decision`)
        .send({ decision: 'APPROVE' })
        .expect(201);

      const after = await request(app.getHttpServer()).get(`/api/v1/tutors/${tutorProfileId}`).expect(200);
      expect(after.body.data.isVerified).toBe(true);
    });
  });
});
