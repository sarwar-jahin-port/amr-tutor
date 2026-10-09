import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Process liveness: is the application running at all? */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  check(): { status: 'ok'; uptimeSeconds: number } {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }

  /** Readiness: is the application able to serve traffic (DB reachable)? */
  @Public()
  @Get('ready')
  async ready(): Promise<{ status: 'ok'; dependencies: { database: 'ok' } }> {
    const databaseHealthy = await this.prisma.isHealthy();

    if (!databaseHealthy) {
      throw new ServiceUnavailableException('Service not ready');
    }

    return { status: 'ok', dependencies: { database: 'ok' } };
  }
}
