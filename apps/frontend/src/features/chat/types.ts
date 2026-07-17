export type ChatChannel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatSector = {
  id: string;
  name: string;
  slug: string;
  channels: ChatChannel[];
};

export type ChatChannelsResponse = {
  sectors: ChatSector[];
};

export type ChatMessage = {
  id: string;
  channelId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
};

export type ChatMessagesResponse = {
  messages: ChatMessage[];
  nextCursor: string | null;
};

export type ChatMessageResponse = {
  message: ChatMessage;
};

export type ChatChannelResponse = {
  channel: ChatChannel & {
    sector: {
      id: string;
      name: string;
      slug: string;
    };
  };
};

export type CreateChannelFormValues = {
  sectorId: string;
  name: string;
  slug: string;
  description: string;
};

export type PrivateChatUser = {
  email: string;
  id: string;
  name: string;
  sector: {
    id: string;
    name: string;
  } | null;
};

export type PrivateChatMessage = {
  author: PrivateChatUser;
  content: string;
  conversationId: string;
  createdAt: string;
  id: string;
};

export type PrivateConversation = {
  createdAt: string;
  id: string;
  lastMessage: PrivateChatMessage | null;
  lastMessageAt: string | null;
  otherParticipant: PrivateChatUser | null;
  participants: PrivateChatUser[];
  title: string | null;
  type: "DIRECT" | "GROUP";
  updatedAt: string;
};

export type PrivateConversationsResponse = {
  conversations: PrivateConversation[];
};

export type PrivateConversationResponse = {
  conversation: PrivateConversation;
};

export type PrivateChatUsersResponse = {
  users: PrivateChatUser[];
};

export type PrivateMessagesResponse = {
  messages: PrivateChatMessage[];
  nextCursor: string | null;
};

export type PrivateMessageResponse = {
  message: PrivateChatMessage;
};

export type RealtimeTicketResponse = {
  expiresIn: number;
  ticket: string;
};
