import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Blueprint Phase 12 (18.2): every private resource must reject
 * unauthenticated access. The app's JwtAuthGuard is bound globally and
 * fails closed — a route is only public if explicitly marked @Public() —
 * so this spec is a single inventory of every controller route, asserting
 * the global guard actually behaves that way for each one. It needs no
 * fixtures: the guard runs before any body/param parsing or DB lookup, so
 * a missing Authorization header is rejected with 401 regardless of
 * whether the referenced ID exists.
 *
 * Any new controller route must be added to one of the two lists below —
 * that's the point: an endpoint added here with the wrong expectation (or
 * left out) is a prompt to double check whether it's really meant to be
 * public.
 */
describe('Security: unauthenticated access is rejected (e2e)', () => {
  let app: INestApplication;

  const PLACEHOLDER_ID = '00000000-0000-4000-8000-000000000000';

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
  });

  afterAll(async () => {
    await app.close();
  });

  const PROTECTED_ROUTES: Array<[method: 'get' | 'post' | 'patch' | 'put' | 'delete', path: string]> = [
    // applications
    ['get', `/api/v1/applications/${PLACEHOLDER_ID}`],
    ['get', `/api/v1/listings/${PLACEHOLDER_ID}/applications`],
    ['patch', `/api/v1/applications/${PLACEHOLDER_ID}/status`],
    ['post', `/api/v1/listings/${PLACEHOLDER_ID}/applications`],
    ['get', '/api/v1/users/me/applications'],
    ['patch', `/api/v1/applications/${PLACEHOLDER_ID}/withdraw`],
    // audit
    ['get', '/api/v1/admin/audit-logs'],
    // auth
    ['get', '/api/v1/auth/me'],
    // guardians
    ['post', '/api/v1/guardians/me/profile'],
    ['get', '/api/v1/guardians/me/profile'],
    ['patch', '/api/v1/guardians/me/profile'],
    // listings (owner + admin surfaces; /listings and /listings/:id themselves are public, see below)
    ['get', '/api/v1/admin/listings'],
    ['patch', `/api/v1/admin/listings/${PLACEHOLDER_ID}/status`],
    ['post', '/api/v1/listings'],
    ['get', '/api/v1/users/me/listings'],
    ['get', `/api/v1/users/me/listings/${PLACEHOLDER_ID}`],
    ['patch', `/api/v1/users/me/listings/${PLACEHOLDER_ID}`],
    ['post', `/api/v1/users/me/listings/${PLACEHOLDER_ID}/submit`],
    ['post', `/api/v1/users/me/listings/${PLACEHOLDER_ID}/close`],
    // messaging
    ['post', `/api/v1/applications/${PLACEHOLDER_ID}/contact-share`],
    ['get', `/api/v1/applications/${PLACEHOLDER_ID}/contact-share`],
    ['post', `/api/v1/applications/${PLACEHOLDER_ID}/conversation`],
    ['get', '/api/v1/conversations'],
    ['get', `/api/v1/conversations/${PLACEHOLDER_ID}/messages`],
    ['post', `/api/v1/conversations/${PLACEHOLDER_ID}/messages`],
    ['patch', `/api/v1/conversations/${PLACEHOLDER_ID}/read`],
    // notifications
    ['get', '/api/v1/notifications'],
    ['get', '/api/v1/notifications/unread-count'],
    ['patch', `/api/v1/notifications/${PLACEHOLDER_ID}/read`],
    ['patch', '/api/v1/notifications/read-all'],
    // reports
    ['get', '/api/v1/admin/reports'],
    ['patch', `/api/v1/admin/reports/${PLACEHOLDER_ID}/status`],
    ['post', '/api/v1/reports'],
    ['get', '/api/v1/users/me/reports'],
    // tutors (owner + admin surfaces; /tutors and /tutors/:id themselves are public, see below)
    ['post', '/api/v1/tutors/me/profile'],
    ['get', '/api/v1/tutors/me/profile'],
    ['patch', '/api/v1/tutors/me/profile'],
    ['put', '/api/v1/tutors/me/subjects'],
    ['put', '/api/v1/tutors/me/grades'],
    ['put', '/api/v1/tutors/me/curricula'],
    ['put', '/api/v1/tutors/me/locations'],
    ['put', '/api/v1/tutors/me/availability'],
    // users
    ['get', '/api/v1/admin/users'],
    ['get', `/api/v1/admin/users/${PLACEHOLDER_ID}`],
    ['patch', `/api/v1/admin/users/${PLACEHOLDER_ID}/status`],
    ['patch', '/api/v1/users/me'],
    ['post', '/api/v1/users/me/roles'],
    ['delete', '/api/v1/users/me/roles/TUTOR'],
    // verifications
    ['get', '/api/v1/admin/verifications'],
    ['post', `/api/v1/admin/verifications/${PLACEHOLDER_ID}/decision`],
    ['post', '/api/v1/verifications'],
    ['get', '/api/v1/verifications/me'],
    ['get', `/api/v1/verifications/${PLACEHOLDER_ID}`],
    ['get', `/api/v1/verifications/${PLACEHOLDER_ID}/evidence/${PLACEHOLDER_ID}/download-url`],
    ['post', `/api/v1/verifications/${PLACEHOLDER_ID}/evidence-upload`],
    ['post', `/api/v1/verifications/${PLACEHOLDER_ID}/submit`],
  ];

  it.each(PROTECTED_ROUTES)('%s %s requires authentication', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
  });

  const PUBLIC_ROUTES: Array<[method: 'get' | 'post', path: string]> = [
    ['get', '/api/v1/health'],
    ['get', '/api/v1/health/ready'],
    ['get', '/api/v1/listings'],
    ['get', `/api/v1/listings/${PLACEHOLDER_ID}`],
    ['get', '/api/v1/tutors'],
    ['get', `/api/v1/tutors/${PLACEHOLDER_ID}`],
    ['get', '/api/v1/references/universities'],
    ['get', '/api/v1/references/subjects'],
    ['get', '/api/v1/references/curricula'],
    ['get', '/api/v1/references/grades'],
    ['get', '/api/v1/references/locations'],
    ['post', '/api/v1/auth/register'],
    ['post', '/api/v1/auth/login'],
    // /auth/refresh and /auth/logout are also @Public() at the guard level
    // (they authenticate via the refresh cookie, not the JWT guard) but
    // correctly return 401 on their own when no cookie is present — that
    // specific behavior has its own tests in auth.e2e-spec.ts, so it's
    // intentionally not asserted here.
  ];

  it.each(PUBLIC_ROUTES)(
    '%s %s does not require authentication (is intentionally public)',
    async (method, path) => {
      const res = await request(app.getHttpServer())[method](path);
      expect(res.status).not.toBe(401);
    },
  );
});
