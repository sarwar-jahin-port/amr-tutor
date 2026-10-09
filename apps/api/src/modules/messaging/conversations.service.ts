import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResponse, PaginationQueryDto, paginate } from '../../common/dto/pagination-query.dto';
import { PrismaService } from '../../database/prisma.service';
import { ApplicationsService } from '../applications/applications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConversationSummaryDto, MessageDto, toConversationSummaryDto, toMessageDto } from './dto/conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';

const CONVERSATION_INCLUDE = {
  application: {
    select: {
      listing: {
        select: {
          id: true,
          title: true,
          guardianUserId: true,
          guardianUser: { select: { guardianProfile: { select: { displayName: true } } } },
        },
      },
      tutorProfile: { select: { userId: true, fullName: true } },
    },
  },
  messages: { orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.ConversationInclude;

type ConversationWithRelations = Prisma.ConversationGetPayload<{ include: typeof CONVERSATION_INCLUDE }>;

export interface MessagePage {
  data: MessageDto[];
  meta: { nextCursor: string | null };
}

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Idempotent: at most one conversation per application (decision record §4.4 — "no cold-messaging"). */
  async createConversation(userId: string, applicationId: string): Promise<ConversationSummaryDto> {
    const application = await this.applications.assertParticipant(userId, applicationId);

    const existing = await this.prisma.conversation.findUnique({
      where: { applicationId },
      include: CONVERSATION_INCLUDE,
    });
    if (existing) {
      return this.toSummaryWithUnread(existing, userId);
    }

    let conversation: ConversationWithRelations;
    try {
      conversation = await this.prisma.conversation.create({
        data: {
          applicationId,
          participants: {
            create: [{ userId: application.tutorUserId }, { userId: application.guardianUserId }],
          },
        },
        include: CONVERSATION_INCLUDE,
      });
    } catch (error) {
      // Conversation.applicationId is @unique — this backstops two
      // simultaneous "start a conversation" requests the same way
      // ApplicationsService.apply backstops duplicate applications.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        conversation = await this.prisma.conversation.findUniqueOrThrow({
          where: { applicationId },
          include: CONVERSATION_INCLUDE,
        });
      } else {
        throw error;
      }
    }

    return this.toSummaryWithUnread(conversation, userId);
  }

  async listConversations(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ConversationSummaryDto>> {
    const where = { userId };

    const [rows, total] = await Promise.all([
      this.prisma.conversationParticipant.findMany({
        where,
        select: { lastReadAt: true, conversation: { include: CONVERSATION_INCLUDE } },
        orderBy: { conversation: { updatedAt: 'desc' } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.conversationParticipant.count({ where }),
    ]);

    const data = await Promise.all(
      rows.map(async (row) => {
        const hasUnread = await this.hasUnreadMessages(row.conversation.id, userId, row.lastReadAt);
        return toConversationSummaryDto(row.conversation, userId, hasUnread);
      }),
    );

    return paginate(data, query.page, query.limit, total);
  }

  async getMessages(userId: string, conversationId: string, query: MessageQueryDto): Promise<MessagePage> {
    await this.assertConversationParticipant(userId, conversationId);

    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      ...(query.before && { cursor: { id: query.before }, skip: 1 }),
    });

    return {
      data: rows.map(toMessageDto).reverse(),
      meta: { nextCursor: rows.length === query.limit ? (rows.at(-1)?.id ?? null) : null },
    };
  }

  async sendMessage(userId: string, conversationId: string, dto: CreateMessageDto): Promise<MessageDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { userId: true } } },
    });

    if (!conversation || !conversation.participants.some((p) => p.userId === userId)) {
      throw new NotFoundException('Conversation not found.');
    }
    if (conversation.status !== 'ACTIVE') {
      throw new BadRequestException('This conversation is not open for new messages.');
    }

    const message = await this.prisma.message.create({
      data: { conversationId, senderUserId: userId, body: dto.body },
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    const recipientUserId = conversation.participants.find((p) => p.userId !== userId)?.userId;
    if (recipientUserId) {
      await this.notifications.create(recipientUserId, 'MESSAGE_RECEIVED', { conversationId });
    }

    return toMessageDto(message);
  }

  async markRead(userId: string, conversationId: string): Promise<void> {
    const result = await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Conversation not found.');
    }
  }

  private async assertConversationParticipant(
    userId: string,
    conversationId: string,
  ): Promise<{ lastReadAt: Date | null }> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { lastReadAt: true },
    });
    if (!participant) {
      throw new NotFoundException('Conversation not found.');
    }
    return participant;
  }

  private async toSummaryWithUnread(
    conversation: ConversationWithRelations,
    userId: string,
  ): Promise<ConversationSummaryDto> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: conversation.id, userId } },
      select: { lastReadAt: true },
    });
    const hasUnread = await this.hasUnreadMessages(conversation.id, userId, participant?.lastReadAt ?? null);
    return toConversationSummaryDto(conversation, userId, hasUnread);
  }

  private async hasUnreadMessages(conversationId: string, userId: string, lastReadAt: Date | null): Promise<boolean> {
    const count = await this.prisma.message.count({
      where: {
        conversationId,
        senderUserId: { not: userId },
        ...(lastReadAt && { createdAt: { gt: lastReadAt } }),
      },
    });
    return count > 0;
  }
}
