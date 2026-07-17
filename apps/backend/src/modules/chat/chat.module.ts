import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { ChatController } from "./chat.controller";
import { ChatRealtimeGateway } from "./chat-realtime.gateway";
import { ChatService } from "./chat.service";

@Module({
  controllers: [ChatController],
  imports: [AuthModule, DatabaseModule],
  providers: [ChatRealtimeGateway, ChatService],
})
export class ChatModule {}
