import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ApplicationsService } from './applications.service';
import { ApplicationDetailDto } from './dto/application.dto';

/**
 * Application detail is reachable by either side of the relationship — the
 * applicant or the listing owner — so, unlike ApplicationsController and
 * ApplicationOwnerController, this route carries no @Roles() and instead
 * checks participation inside the service.
 */
@Controller('applications')
export class ApplicationDetailController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get(':id')
  async getDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: ApplicationDetailDto }> {
    const data = await this.applicationsService.getDetail(user.id, id);
    return { data };
  }
}
