import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { isHealthy: jest.Mock };

  beforeEach(async () => {
    prisma = { isHealthy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get(HealthController);
  });

  it('reports liveness without checking dependencies', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(typeof result.uptimeSeconds).toBe('number');
    expect(prisma.isHealthy).not.toHaveBeenCalled();
  });

  it('reports ready when the database is reachable', async () => {
    prisma.isHealthy.mockResolvedValue(true);

    const result = await controller.ready();

    expect(result).toEqual({ status: 'ok', dependencies: { database: 'ok' } });
  });

  it('throws when the database is unreachable', async () => {
    prisma.isHealthy.mockResolvedValue(false);

    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
