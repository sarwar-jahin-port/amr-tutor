import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Process liveness: is the application running at all? */
  @Get()
  @HttpCode(HttpStatus.OK)
  check(): { status: 'ok'; uptimeSeconds: number } {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }

  /** Readiness: is the application able to serve traffic (DB reachable)? */
  @Get('ready')
  async ready(): Promise<{ status: 'ok'; dependencies: { database: 'ok' } }> {
    const databaseHealthy = await this.prisma.isHealthy();

    if (!databaseHealthy) {
      throw new ServiceUnavailableException('Service not ready');
    }

    return { status: 'ok', dependencies: { database: 'ok' } };
  }
}
