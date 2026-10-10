import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { extractCookie, uniqueEmail } from './test-utils';

const PASSWORD = 'StrongPassword123!';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Functional coverage lives here; rate-limiting has its own spec file
      // so the two don't interfere with each other's call counts.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    jwt = moduleFixture.get(JwtService);
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  async function registerUser(roles: string[] = ['TUTOR']) {
    const email = uniqueEmail('auth-spec');
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: PASSWORD, roles })
      .expect(201);
    createdUserIds.push(res.body.data.id);
    return { email, id: res.body.data.id as string };
  }

  describe('POST /auth/register', () => {
    it('creates an account with only the requested self-registerable roles', async () => {
      const email = uniqueEmail('register-success');
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: PASSWORD, roles: ['TUTOR', 'GUARDIAN'] })
        .expect(201);

      createdUserIds.push(res.body.data.id);
      expect(res.body.data).toMatchObject({ email, status: 'ACTIVE' });
      expect(res.body.data.roles.sort()).toEqual(['GUARDIAN', 'TUTOR']);
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('rejects self-assigning an administrative role', async () => {
      const email = uniqueEmail('register-admin-attempt');
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: PASSWORD, roles: ['ADMIN'] })
        .expect(400);

      const found = await prisma.user.findUnique({ where: { email } });
      expect(found).toBeNull();
    });

    it('rejects a duplicate email with 409 and does not leak details', async () => {
      const { email } = await registerUser();

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: PASSWORD, roles: ['TUTOR'] })
        .expect(409);

      expect(res.body.message).toMatch(/already exists/i);
    });

    it('rejects an empty roles array', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: uniqueEmail('register-no-roles'), password: PASSWORD, roles: [] })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('resists account enumeration: wrong password and unknown email give the same error', async () => {
      const { email } = await registerUser();

      const wrongPassword = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPassword123!' })
        .expect(401);

      const unknownEmail = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: uniqueEmail('never-registered'), password: 'WrongPassword123!' })
        .expect(401);

      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });

    it('rejects login for a suspended account with a distinct, non-generic error', async () => {
      const { email, id } = await registerUser();
      await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(403);

      expect(res.body.message).toMatch(/not active/i);
    });

    it('logs in successfully and sets an HttpOnly refresh cookie', async () => {
      const { email } = await registerUser();

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.expiresIn).toBe(900);

      const setCookie = res.headers['set-cookie'] as unknown as string[];
      const refreshCookieLine = setCookie.find((c) => c.startsWith('refresh_token='));
      expect(refreshCookieLine).toBeDefined();
      expect(refreshCookieLine).toMatch(/HttpOnly/);
      expect(refreshCookieLine).toMatch(/SameSite=Lax/i);
    });
  });

  describe('GET /auth/me', () => {
    it('rejects requests with no access token', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('rejects requests with a garbage access token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });

    it('returns the authenticated user for a valid access token', async () => {
      const { email } = await registerUser();
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`)
        .expect(200);

      expect(res.body.data.email).toBe(email);
    });

    it('rejects an access token that has already expired', async () => {
      const { id } = await registerUser();
      const expiredToken = jwt.sign({ sub: id, roles: ['TUTOR'] }, { expiresIn: -10 });

      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('POST /auth/refresh and /auth/logout', () => {
    it('rejects a refresh call with no cookie', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/refresh').expect(401);
    });

    it('rotates the refresh token and detects reuse of the old one', async () => {
      const { email } = await registerUser();
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      const firstRefreshCookie = extractCookie(login, 'refresh_token');
      expect(firstRefreshCookie).toBeDefined();

      const secondRefresh = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refresh_token=${firstRefreshCookie}`)
        .expect(200);

      const secondRefreshCookie = extractCookie(secondRefresh, 'refresh_token');
      expect(secondRefreshCookie).toBeDefined();
      expect(secondRefreshCookie).not.toBe(firstRefreshCookie);

      // Reusing the now-rotated-away first token is a reuse/theft signal.
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refresh_token=${firstRefreshCookie}`)
        .expect(401);

      // The entire session chain — including the token issued by the
      // legitimate rotation above — must now be revoked too.
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refresh_token=${secondRefreshCookie}`)
        .expect(401);
    });

    it('rejects a refresh call once the stored session has expired', async () => {
      const { email } = await registerUser();
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      const refreshCookie = extractCookie(login, 'refresh_token');
      await prisma.refreshToken.updateMany({
        where: { user: { email } },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refresh_token=${refreshCookie}`)
        .expect(401);

      expect(res.body.message).toMatch(/expired/i);
    });

    it('logout revokes the refresh session', async () => {
      const { email } = await registerUser();
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      const refreshCookie = extractCookie(login, 'refresh_token');

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', `refresh_token=${refreshCookie}`)
        .expect(204);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refresh_token=${refreshCookie}`)
        .expect(401);
    });

    it('logout is idempotent when there is no session to revoke', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/logout').expect(204);
    });
  });

  describe('Role self-service (/users/me/roles)', () => {
    async function loginAndGetToken(email: string) {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);
      return login.body.data.accessToken as string;
    }

    it('adds and removes a self-registerable role', async () => {
      const { email } = await registerUser(['TUTOR']);
      const token = await loginAndGetToken(email);

      const added = await request(app.getHttpServer())
        .post('/api/v1/users/me/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'GUARDIAN' })
        .expect(201);
      expect(added.body.data.roles.sort()).toEqual(['GUARDIAN', 'TUTOR']);

      const removed = await request(app.getHttpServer())
        .delete('/api/v1/users/me/roles/TUTOR')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(removed.body.data.roles).toEqual(['GUARDIAN']);
    });

    it('refuses to remove the last remaining role', async () => {
      const { email } = await registerUser(['TUTOR']);
      const token = await loginAndGetToken(email);

      await request(app.getHttpServer())
        .delete('/api/v1/users/me/roles/TUTOR')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('rejects adding an administrative role through self-service', async () => {
      const { email } = await registerUser(['TUTOR']);
      const token = await loginAndGetToken(email);

      await request(app.getHttpServer())
        .post('/api/v1/users/me/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ADMIN' })
        .expect(400);
    });
  });

  describe('PATCH /users/me', () => {
    it('updates the phone number', async () => {
      const { email } = await registerUser();
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`)
        .send({ phone: '01712345670' })
        .expect(200);

      expect(res.body.data.phone).toBe('01712345670');
    });

    it('rejects a phone number already used by another account', async () => {
      const phone = '01798765432';
      const first = await registerUser();
      await prisma.user.update({ where: { id: first.id }, data: { phone } });

      const { email } = await registerUser();
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`)
        .send({ phone })
        .expect(409);
    });
  });
});
