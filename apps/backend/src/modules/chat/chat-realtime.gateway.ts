import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Namespace, Socket } from "socket.io";

import { AuthService } from "../auth/auth.service";

const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
        const user = await this.authService.validateRealtimeTicket(ticket);
        socket.data.userId = user.id;
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
