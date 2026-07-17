import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type { HttpRequest } from "../auth/types/http-request";
import type { CreateChannelDto } from "./dto/create-channel.dto";
import type { CreateMessageDto } from "./dto/create-message.dto";
import type { ListMessagesQueryDto } from "./dto/list-messages-query.dto";

const USER_AGENT_MAX_LENGTH = 512;
const IP_ADDRESS_MAX_LENGTH = 64;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const channelSelect = {
  createdAt: true,
  description: true,
  id: true,
  isActive: true,
  name: true,
  sector: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  slug: true,
  updatedAt: true,
} satisfies Prisma.ChannelSelect;

const messageSelect = {
  author: {
    select: {
      id: true,
      name: true,
    },
  },
  channelId: true,
  content: true,
  createdAt: true,
  id: true,
} satisfies Prisma.MessageSelect;

const privateUserSelect = {
  email: true,
  id: true,
  name: true,
  sector: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.UserSelect;

const conversationMessageSelect = {
  author: {
    select: privateUserSelect,
  },
  content: true,
  conversationId: true,
  createdAt: true,
  id: true,
} satisfies Prisma.ConversationMessageSelect;

const conversationSelect = {
  createdAt: true,
  id: true,
  lastMessageAt: true,
  messages: {
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
    select: conversationMessageSelect,
    take: 1,
  },
  participants: {
    orderBy: { joinedAt: "asc" as const },
    select: {
      user: {
        select: privateUserSelect,
      },
    },
  },
  title: true,
  type: true,
  updatedAt: true,
} satisfies Prisma.ConversationSelect;

type ConversationRecord = Prisma.ConversationGetPayload<{
  select: typeof conversationSelect;
}>;

type MessageCursor = {
  createdAt: Date;
  id: string;
};

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async listChannels(currentUser: AuthenticatedUser) {
    const sectors = await this.prisma.sector.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        channels: {
          orderBy: [{ slug: "asc" }, { id: "asc" }],
          select: {
            createdAt: true,
            description: true,
            id: true,
            isActive: true,
            name: true,
            slug: true,
            updatedAt: true,
          },
          where: { isActive: true },
        },
        id: true,
        name: true,
        slug: true,
      },
      where: {
        isActive: true,
        ...this.getSectorScope(currentUser),
      },
    });

    return {
      sectors: sectors.map((sector) => ({
        ...sector,
        channels: [...sector.channels].sort((first, second) => {
          if (first.slug === "geral") return -1;
          if (second.slug === "geral") return 1;
          return first.name.localeCompare(second.name, "pt-BR");
        }),
      })),
    };
  }

  async createChannel(
    createChannelDto: CreateChannelDto,
    currentUser: AuthenticatedUser,
    request: HttpRequest,
  ) {
    const sector = await this.prisma.sector.findFirst({
      select: { id: true },
      where: {
        AND: [
          {
            id: createChannelDto.sectorId,
            isActive: true,
          },
          this.getSectorScope(currentUser),
        ],
      },
    });

    if (!sector) {
      throw new NotFoundException("Sector not found.");
    }

    const slug = this.normalizeSlug(createChannelDto.slug ?? createChannelDto.name);

    if (!slug || slug.length < 2 || slug.length > 80) {
      throw new BadRequestException("Channel slug is invalid.");
    }

    try {
      const channel = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.channel.create({
          data: {
            createdById: currentUser.id,
            description: this.normalizeDescription(createChannelDto.description),
            name: createChannelDto.name.trim(),
            sectorId: sector.id,
            slug,
          },
          select: channelSelect,
        });

        await transaction.auditLog.create({
          data: {
            action: "CHAT_CHANNEL_CREATED",
            actorUserId: currentUser.id,
            ipAddress: this.getIpAddress(request),
            metadata: {
              sectorId: sector.id,
              slug,
              userAgent: this.getUserAgent(request),
            },
            resourceId: created.id,
            resourceType: "Channel",
          },
        });

        return created;
      });

      return { channel };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Channel slug already exists in this sector.");
      }

      throw error;
    }
  }

  async listMessages(
    channelId: string,
    query: ListMessagesQueryDto,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertChannelAccess(channelId, currentUser);
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : undefined;
    const messages = await this.prisma.message.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: messageSelect,
      take: query.limit + 1,
      where: {
        channelId,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
    });
    const hasMore = messages.length > query.limit;
    const page = messages.slice(0, query.limit);
    const oldest = page.at(-1);

    return {
      messages: page.reverse(),
      nextCursor: hasMore && oldest ? this.encodeCursor(oldest.createdAt, oldest.id) : null,
    };
  }

  async createMessage(
    channelId: string,
    createMessageDto: CreateMessageDto,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertChannelAccess(channelId, currentUser);
    const content = createMessageDto.content.trim();

    if (!content) {
      throw new BadRequestException("Message content cannot be empty.");
    }

    const message = await this.prisma.message.create({
      data: {
        authorId: currentUser.id,
        channelId,
        content,
      },
      select: messageSelect,
    });

    return { message };
  }

  async searchUsers(query: { limit: number; search: string }, currentUser: AuthenticatedUser) {
    const search = query.search.trim();
    const users = await this.prisma.user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }, { id: "asc" }],
      select: privateUserSelect,
      take: query.limit,
      where: {
        deletedAt: null,
        id: { not: currentUser.id },
        status: "ACTIVE",
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
    });

    return { users };
  }

  async listConversations(currentUser: AuthenticatedUser) {
    const conversations = await this.prisma.conversation.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: conversationSelect,
      where: {
        participants: {
          some: { userId: currentUser.id },
        },
      },
    });

    return {
      conversations: conversations.map((conversation) =>
        this.toConversation(conversation, currentUser.id),
      ),
    };
  }

  async createDirectConversation(userId: string, currentUser: AuthenticatedUser) {
    if (userId === currentUser.id) {
      throw new BadRequestException("A direct conversation requires another user.");
    }

    const targetUser = await this.prisma.user.findFirst({
      select: { id: true },
      where: {
        deletedAt: null,
        id: userId,
        status: "ACTIVE",
      },
    });

    if (!targetUser) {
      throw new NotFoundException("User not found.");
    }

    const directKey = [currentUser.id, targetUser.id].sort().join(":");
    let conversation = await this.prisma.conversation.findUnique({
      select: conversationSelect,
      where: { directKey },
    });

    if (!conversation) {
      try {
        conversation = await this.prisma.conversation.create({
          data: {
            directKey,
            participants: {
              create: [{ userId: currentUser.id }, { userId: targetUser.id }],
            },
            type: "DIRECT",
          },
          select: conversationSelect,
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
          throw error;
        }

        conversation = await this.prisma.conversation.findUnique({
          select: conversationSelect,
          where: { directKey },
        });
      }
    }

    if (!conversation) {
      throw new ConflictException("Could not create direct conversation.");
    }

    return {
      conversation: this.toConversation(conversation, currentUser.id),
      participantIds: conversation.participants.map((participant) => participant.user.id),
    };
  }

  async listConversationMessages(
    conversationId: string,
    query: ListMessagesQueryDto,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertConversationAccess(conversationId, currentUser.id);
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : undefined;
    const messages = await this.prisma.conversationMessage.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: conversationMessageSelect,
      take: query.limit + 1,
      where: {
        conversationId,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                { createdAt: cursor.createdAt, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
    });
    const hasMore = messages.length > query.limit;
    const page = messages.slice(0, query.limit);
    const oldest = page.at(-1);

    return {
      messages: page.reverse(),
      nextCursor: hasMore && oldest ? this.encodeCursor(oldest.createdAt, oldest.id) : null,
    };
  }

  async createConversationMessage(
    conversationId: string,
    createMessageDto: CreateMessageDto,
    currentUser: AuthenticatedUser,
  ) {
    const content = createMessageDto.content.trim();

    if (!content) {
      throw new BadRequestException("Message content cannot be empty.");
    }

    return this.prisma.$transaction(async (transaction) => {
      const conversation = await transaction.conversation.findFirst({
        select: {
          participants: {
            select: { userId: true },
          },
        },
        where: {
          id: conversationId,
          participants: {
            some: { userId: currentUser.id },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException("Conversation not found.");
      }

      const message = await transaction.conversationMessage.create({
        data: {
          authorId: currentUser.id,
          content,
          conversationId,
        },
        select: conversationMessageSelect,
      });

      await transaction.conversation.update({
        data: { lastMessageAt: message.createdAt },
        where: { id: conversationId },
      });

      return {
        message,
        participantIds: conversation.participants.map((participant) => participant.userId),
      };
    });
  }

  private async assertChannelAccess(channelId: string, currentUser: AuthenticatedUser) {
    const channel = await this.prisma.channel.findFirst({
      select: { id: true },
      where: {
        id: channelId,
        isActive: true,
        sector: {
          isActive: true,
          ...this.getSectorScope(currentUser),
        },
      },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found.");
    }
  }

  private async assertConversationAccess(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      select: { id: true },
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found.");
    }
  }

  private toConversation(conversation: ConversationRecord, currentUserId: string) {
    const participants = conversation.participants.map((participant) => participant.user);

    return {
      createdAt: conversation.createdAt,
      id: conversation.id,
      lastMessage: conversation.messages[0] ?? null,
      lastMessageAt: conversation.lastMessageAt,
      otherParticipant:
        conversation.type === "DIRECT"
          ? (participants.find((participant) => participant.id !== currentUserId) ?? null)
          : null,
      participants,
      title: conversation.title,
      type: conversation.type,
      updatedAt: conversation.updatedAt,
    };
  }

  private getSectorScope(currentUser: AuthenticatedUser): Prisma.SectorWhereInput {
    if (currentUser.permissions.includes("chat.read_all")) {
      return {};
    }

    if (!currentUser.sector) {
      return { id: { in: [] } };
    }

    return { id: currentUser.sector.id };
  }

  private normalizeSlug(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private normalizeDescription(value: string | undefined) {
    const description = value?.trim();
    return description ? description : null;
  }

  private encodeCursor(createdAt: Date, id: string) {
    return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString(
      "base64url",
    );
  }

  private decodeCursor(value: string): MessageCursor {
    try {
      const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
        createdAt?: unknown;
        id?: unknown;
      };
      const createdAt = typeof decoded.createdAt === "string" ? new Date(decoded.createdAt) : null;

      if (
        !createdAt ||
        Number.isNaN(createdAt.getTime()) ||
        typeof decoded.id !== "string" ||
        !UUID_PATTERN.test(decoded.id)
      ) {
        throw new Error("Invalid cursor payload.");
      }

      return { createdAt, id: decoded.id };
    } catch {
      throw new BadRequestException("Message cursor is invalid.");
    }
  }

  private getIpAddress(request: HttpRequest) {
    return this.truncate(request.ip, IP_ADDRESS_MAX_LENGTH);
  }

  private getUserAgent(request: HttpRequest) {
    const userAgent = request.headers["user-agent"];
    return this.truncate(
      Array.isArray(userAgent) ? userAgent.join(" ") : userAgent,
      USER_AGENT_MAX_LENGTH,
    );
  }

  private truncate(value: string | undefined, maxLength: number) {
    if (!value) {
      return undefined;
    }

    return value.slice(0, maxLength);
  }
}
