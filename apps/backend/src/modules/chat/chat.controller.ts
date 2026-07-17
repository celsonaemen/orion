import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type { HttpRequest } from "../auth/types/http-request";
import { ChatService } from "./chat.service";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { CreateDirectConversationDto } from "./dto/create-direct-conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";
import { ListMessagesQueryDto } from "./dto/list-messages-query.dto";
import { SearchChatUsersQueryDto } from "./dto/search-chat-users-query.dto";
import { ChatRealtimeGateway } from "./chat-realtime.gateway";

@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
  constructor(
    private readonly authService: AuthService,
    private readonly chatRealtimeGateway: ChatRealtimeGateway,
    private readonly chatService: ChatService,
  ) {}

  @UseGuards(PermissionsGuard)
  @RequirePermissions("chat.access")
  @Get("channels")
  listChannels(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.chatService.listChannels(currentUser);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions("chat.access", "chat.channels.manage")
  @Post("channels")
  createChannel(
    @Body() createChannelDto: CreateChannelDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: HttpRequest,
  ) {
    return this.chatService.createChannel(createChannelDto, currentUser, request);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions("chat.access")
  @Get("channels/:channelId/messages")
  listMessages(
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Query() query: ListMessagesQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.chatService.listMessages(channelId, query, currentUser);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions("chat.access")
  @Post("channels/:channelId/messages")
  createMessage(
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.chatService.createMessage(channelId, createMessageDto, currentUser);
  }

  @Get("users")
  searchUsers(
    @Query() query: SearchChatUsersQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.chatService.searchUsers(query, currentUser);
  }

  @Get("conversations")
  listConversations(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.chatService.listConversations(currentUser);
  }

  @Post("conversations/direct")
  async createDirectConversation(
    @Body() body: CreateDirectConversationDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const result = await this.chatService.createDirectConversation(body.userId, currentUser);
    this.chatRealtimeGateway.publishConversationUpdated(
      result.conversation.id,
      result.participantIds,
    );

    return { conversation: result.conversation };
  }

  @Get("conversations/:conversationId/messages")
  listConversationMessages(
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Query() query: ListMessagesQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.chatService.listConversationMessages(conversationId, query, currentUser);
  }

  @Post("conversations/:conversationId/messages")
  async createConversationMessage(
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Body() body: CreateMessageDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const result = await this.chatService.createConversationMessage(
      conversationId,
      body,
      currentUser,
    );
    this.chatRealtimeGateway.publishMessage(conversationId, result.message, result.participantIds);

    return { message: result.message };
  }

  @Post("realtime-ticket")
  issueRealtimeTicket(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.issueRealtimeTicket(currentUser);
  }
}
