import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ContactShareService } from './contact-share.service';
import { ContactShareStateDto } from './dto/contact-share-state.dto';
import { ShareContactDto } from './dto/share-contact.dto';

/**
 * Contact sharing (blueprint Phase 9). No @Roles() — either side of an
 * application (applicant or listing owner) may share or view, and
 * ContactShareService checks participation itself.
 */
@Controller('applications/:id/contact-share')
export class ContactShareController {
  constructor(private readonly contactShareService: ContactShareService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.CREATED)
  async share(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Body() dto: ShareContactDto,
  ): Promise<{ data: ContactShareStateDto }> {
    const data = await this.contactShareService.share(user.id, applicationId, dto);
    return { data };
  }

  @Get()
  async getState(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) applicationId: string,
  ): Promise<{ data: ContactShareStateDto }> {
    const data = await this.contactShareService.getState(user.id, applicationId);
    return { data };
  }
}
