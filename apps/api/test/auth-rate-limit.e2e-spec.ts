import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { uniqueEmail } from './test-utils';

describe('Auth rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('throttles repeated login attempts from the same client', async () => {
    const email = uniqueEmail('rate-limit');

    // The login route is throttled to 5 requests/60s regardless of outcome.
    const attempts = await Promise.all(
      Array.from({ length: 6 }, () =>
        request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email, password: 'whatever-does-not-matter' }),
      ),
    );

    const statuses = attempts.map((res) => res.status);
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
  });
});
