import { Module } from "@nestjs/common"
import { ChatController } from "./chat.controller"
import { ChatService } from "./chat.service"
import { OpenAIService } from "./services/openai.service"
import { DatabaseService } from "./services/database.service"

@Module({
  controllers: [ChatController],
  providers: [ChatService, OpenAIService, DatabaseService],
})
export class ChatModule {}
