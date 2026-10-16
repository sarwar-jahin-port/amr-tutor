import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PaginatedResponse, PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ConversationsService, MessagePage } from './conversations.service';
import { ConversationSummaryDto, MessageDto } from './dto/conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';

/**
 * Messaging (blueprint Phase 9). No @Roles() anywhere here — a
 * conversation's two participants are one tutor and one guardian, and
 * ConversationsService checks participation itself rather than role.
 */
@Controller()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post('applications/:id/conversation')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) applicationId: string,
  ): Promise<{ data: ConversationSummaryDto }> {
    const data = await this.conversationsService.createConversation(user.id, applicationId);
    return { data };
  }

  @Get('conversations')
  async listConversations(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ConversationSummaryDto>> {
    return this.conversationsService.listConversations(user.id, query);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Query() query: MessageQueryDto,
  ): Promise<MessagePage> {
    return this.conversationsService.getMessages(user.id, conversationId, query);
  }

  @Post('conversations/:id/messages')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Body() dto: CreateMessageDto,
  ): Promise<{ data: MessageDto }> {
    const data = await this.conversationsService.sendMessage(user.id, conversationId, dto);
    return { data };
  }

  @Patch('conversations/:id/read')
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) conversationId: string,
  ): Promise<{ data: { ok: true } }> {
    await this.conversationsService.markRead(user.id, conversationId);
    return { data: { ok: true } };
  }
}
