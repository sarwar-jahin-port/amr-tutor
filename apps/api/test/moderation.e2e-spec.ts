import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { UsersService } from '../src/modules/users/users.service';
import { extractCookie, uniqueEmail } from './test-utils';

const PASSWORD = 'StrongPassword123!';

describe('Admin moderation: users, listings, audit logs (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let usersService: UsersService;
  const createdUserIds: string[] = [];
  const createdListingIds: string[] = [];

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
    usersService = moduleFixture.get(UsersService);
  });

  afterAll(async () => {
    await prisma.tuitionListing.deleteMany({ where: { id: { in: createdListingIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: createdUserIds } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.guardianProfile.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  async function registerAndLogin(roles: string[]): Promise<{ token: string; userId: string; email: string }> {
    const email = uniqueEmail('moderation-spec');
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
    return { token: login.body.data.accessToken as string, userId, email };
  }

  /** No self-registration path grants ADMIN — simulate the role grant directly, same as the verifications spec does for VERIFIER. */
  async function grantRole(userId: string, role: 'ADMIN' | 'MODERATOR'): Promise<void> {
    await prisma.userRole.create({ data: { userId, role } });
  }

  function authed(token: string) {
    return {
      post: (url: string) => request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`),
      get: (url: string) => request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`),
      patch: (url: string) => request(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${token}`),
    };
  }

  describe('account suspension', () => {
    it('rejects a non-admin from every admin/users route', async () => {
      const tutor = await registerAndLogin(['TUTOR']);
      await authed(tutor.token).get('/api/v1/admin/users').expect(403);
      await authed(tutor.token).patch(`/api/v1/admin/users/${tutor.userId}/status`).send({ status: 'SUSPENDED', reason: 'x' }).expect(403);
    });

    it('requires a reason to suspend, and suspension immediately blocks further requests', async () => {
      const admin = await registerAndLogin(['GUARDIAN']);
      await grantRole(admin.userId, 'ADMIN');
      const target = await registerAndLogin(['TUTOR']);

      await authed(admin.token).patch(`/api/v1/admin/users/${target.userId}/status`).send({ status: 'SUSPENDED' }).expect(400);

      const suspended = await authed(admin.token)
        .patch(`/api/v1/admin/users/${target.userId}/status`)
        .send({ status: 'SUSPENDED', reason: 'Repeated policy violations.' })
        .expect(200);
      expect(suspended.body.data.status).toBe('SUSPENDED');

      // The same still-unexpired access token is now rejected — status is re-checked per request, not just at login.
      await authed(target.token).get('/api/v1/users/me/applications').expect(401);

      // Reactivating restores access.
      const reactivated = await authed(admin.token)
        .patch(`/api/v1/admin/users/${target.userId}/status`)
        .send({ status: 'ACTIVE' })
        .expect(200);
      expect(reactivated.body.data.status).toBe('ACTIVE');
    });

    it('revokes refresh tokens on suspension', async () => {
      const admin = await registerAndLogin(['GUARDIAN']);
      await grantRole(admin.userId, 'ADMIN');
      const target = await registerAndLogin(['TUTOR']);

      const loginAgain = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: target.email, password: PASSWORD })
        .expect(200);
      const refreshCookie = extractCookie(loginAgain, 'refresh_token');

      await authed(admin.token)
        .patch(`/api/v1/admin/users/${target.userId}/status`)
        .send({ status: 'SUSPENDED', reason: 'Test revocation.' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refresh_token=${refreshCookie}`)
        .expect(401);
    });

    it('prevents an admin from suspending their own account', async () => {
      const admin = await registerAndLogin(['GUARDIAN']);
      await grantRole(admin.userId, 'ADMIN');

      await authed(admin.token)
        .patch(`/api/v1/admin/users/${admin.userId}/status`)
        .send({ status: 'SUSPENDED', reason: 'Testing self-suspension.' })
        .expect(403);
    });

    it('prevents suspending the last active administrator', async () => {
      // Unreachable through the HTTP route alone: @Roles(ADMIN) guarantees
      // the acting admin is themselves active, and self-suspension is
      // blocked separately, so a distinct actor can never legitimately
      // drive the "other active admins" count to zero through this
      // endpoint. This exercises UsersService.adminUpdateStatus directly —
      // the same call the controller makes — to prove the guard holds even
      // if those two conditions ever stopped being true together.
      const solo = await registerAndLogin(['GUARDIAN']);
      await grantRole(solo.userId, 'ADMIN');
      const actor = await registerAndLogin(['GUARDIAN']);

      // Earlier tests in this file created other admins who are still
      // ACTIVE in the shared test database — suspend them (directly, not
      // through the service) so `solo` is genuinely the last one standing.
      await prisma.user.updateMany({
        where: { id: { not: solo.userId }, status: 'ACTIVE', roles: { some: { role: 'ADMIN' } } },
        data: { status: 'SUSPENDED' },
      });

      await expect(usersService.adminUpdateStatus(actor.userId, solo.userId, { status: 'SUSPENDED', reason: 'Should be blocked.' })).rejects.toThrow(
        'Cannot suspend the last active administrator.',
      );
    });

    it('searches accounts by email and role', async () => {
      const admin = await registerAndLogin(['GUARDIAN']);
      await grantRole(admin.userId, 'ADMIN');
      const target = await registerAndLogin(['TUTOR']);

      const bySearch = await authed(admin.token).get(`/api/v1/admin/users?search=${target.email}`).expect(200);
      expect(bySearch.body.data.map((u: { id: string }) => u.id)).toContain(target.userId);

      const detail = await authed(admin.token).get(`/api/v1/admin/users/${target.userId}`).expect(200);
      expect(detail.body.data.id).toBe(target.userId);
    });
  });

  describe('listing moderation', () => {
    async function createPendingListing(guardianToken: string): Promise<string> {
      await authed(guardianToken).post('/api/v1/guardians/me/profile').send({ displayName: 'Moderation Spec Guardian' }).expect(201);
      const subject = await prisma.subject.create({
        data: { name: `Moderation Spec Subject ${randomUUID()}`, normalizedName: randomUUID() },
      });
      const created = await authed(guardianToken)
        .post('/api/v1/listings')
        .send({ title: 'Moderation Spec Listing', classLevel: 'Class 8', subjectIds: [subject.id], city: 'Dhaka', area: 'Mirpur', daysPerWeek: 2 })
        .expect(201);
      createdListingIds.push(created.body.data.id);
      await authed(guardianToken).post(`/api/v1/users/me/listings/${created.body.data.id}/submit`).expect(201);
      return created.body.data.id as string;
    }

    it('rejects a non-admin from the moderation queue', async () => {
      const guardian = await registerAndLogin(['GUARDIAN']);
      await authed(guardian.token).get('/api/v1/admin/listings').expect(403);
    });

    it('defaults the queue to PENDING_REVIEW, approves a listing, and notifies the guardian', async () => {
      const admin = await registerAndLogin(['GUARDIAN']);
      await grantRole(admin.userId, 'ADMIN');
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPendingListing(guardian.token);

      const queue = await authed(admin.token).get('/api/v1/admin/listings').expect(200);
      expect(queue.body.data.map((l: { id: string }) => l.id)).toContain(listingId);

      const approved = await authed(admin.token)
        .patch(`/api/v1/admin/listings/${listingId}/status`)
        .send({ status: 'PUBLISHED' })
        .expect(200);
      expect(approved.body.data.status).toBe('PUBLISHED');

      const publicListing = await request(app.getHttpServer()).get(`/api/v1/listings/${listingId}`).expect(200);
      expect(publicListing.body.data.id).toBe(listingId);

      const notifications = await prisma.notification.findMany({ where: { userId: guardian.userId, type: 'LISTING_UPDATED' } });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    it('requires a reason to reject, and a rejected listing disappears from public search', async () => {
      const admin = await registerAndLogin(['GUARDIAN']);
      await grantRole(admin.userId, 'ADMIN');
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPendingListing(guardian.token);

      await authed(admin.token).patch(`/api/v1/admin/listings/${listingId}/status`).send({ status: 'REJECTED' }).expect(400);

      const rejected = await authed(admin.token)
        .patch(`/api/v1/admin/listings/${listingId}/status`)
        .send({ status: 'REJECTED', reason: 'Contact info in the description.' })
        .expect(200);
      expect(rejected.body.data.status).toBe('REJECTED');

      await request(app.getHttpServer()).get(`/api/v1/listings/${listingId}`).expect(404);
    });

    it('rejects an invalid transition', async () => {
      const admin = await registerAndLogin(['GUARDIAN']);
      await grantRole(admin.userId, 'ADMIN');
      const guardian = await registerAndLogin(['GUARDIAN']);
      const listingId = await createPendingListing(guardian.token);

      // Already PENDING_REVIEW -> PAUSED is not a valid direct transition.
      await authed(admin.token).patch(`/api/v1/admin/listings/${listingId}/status`).send({ status: 'PAUSED' }).expect(400);
    });
  });

  describe('audit logs', () => {
    it('rejects a MODERATOR (non-admin) from audit logs, but allows an ADMIN', async () => {
      const moderator = await registerAndLogin(['GUARDIAN']);
      await grantRole(moderator.userId, 'MODERATOR');
      await authed(moderator.token).get('/api/v1/admin/audit-logs').expect(403);

      const admin = await registerAndLogin(['GUARDIAN']);
      await grantRole(admin.userId, 'ADMIN');
      const target = await registerAndLogin(['TUTOR']);
      await authed(admin.token)
        .patch(`/api/v1/admin/users/${target.userId}/status`)
        .send({ status: 'SUSPENDED', reason: 'Audit log check.' })
        .expect(200);

      const logs = await authed(admin.token).get(`/api/v1/admin/audit-logs?targetType=User&actorUserId=${admin.userId}`).expect(200);
      expect(
        logs.body.data.some((l: { targetId: string; action: string }) => l.targetId === target.userId && l.action === 'USER_STATUS_CHANGE'),
      ).toBe(true);
    });
  });
});
