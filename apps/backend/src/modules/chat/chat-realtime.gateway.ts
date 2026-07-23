import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Namespace, Socket } from "socket.io";

import { getAllowedFrontendOrigins } from "../../config/runtime-config";
import { AuthService } from "../auth/auth.service";

const allowedOrigins = getAllowedFrontendOrigins();

type RealtimeMessage = {
  author: {
    email: string;
    id: string;
    name: string;
    sector: {
      id: string;
      name: string;
    } | null;
  };
  content: string;
  conversationId: string;
  createdAt: Date;
  id: string;
};

@WebSocketGateway({
  cors: {
    credentials: true,
    origin: allowedOrigins,
  },
  namespace: "/chat",
})
export class ChatRealtimeGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  private namespace?: Namespace;

  constructor(private readonly authService: AuthService) {}

  afterInit(namespace: Namespace) {
    namespace.use(async (socket, next) => {
      const ticket = socket.handshake.auth?.ticket;

      if (typeof ticket !== "string" || !ticket) {
        next(new Error("unauthorized"));
        return;
      }

      try {
        const realtimeSession = await this.authService.validateRealtimeTicket(ticket);
        socket.data.realtimeExpiresAt = realtimeSession.expiresAt.getTime();
        socket.data.userId = realtimeSession.user.id;
        next();
      } catch {
        next(new Error("unauthorized"));
      }
    });
  }

  async handleConnection(client: Socket) {
    const userId = client.data.userId;

    if (typeof userId !== "string") {
      client.disconnect(true);
      return;
    }

    await client.join(this.userRoom(userId));

    const realtimeExpiresAt = client.data.realtimeExpiresAt;
    if (typeof realtimeExpiresAt !== "number") {
      client.disconnect(true);
      return;
    }

    const expiryTimer = setTimeout(
      () => client.disconnect(true),
      Math.max(0, realtimeExpiresAt - Date.now()),
    );
    client.once("disconnect", () => clearTimeout(expiryTimer));
  }

  publishConversationUpdated(conversationId: string, participantIds: string[]) {
    for (const userId of new Set(participantIds)) {
      this.namespace?.to(this.userRoom(userId)).emit("conversation.updated", { conversationId });
    }
  }

  publishMessage(conversationId: string, message: RealtimeMessage, participantIds: string[]) {
    for (const userId of new Set(participantIds)) {
      this.namespace?.to(this.userRoom(userId)).emit("conversation.message", {
        conversationId,
        message,
      });
    }
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }
}
