import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Param,
  Delete,
  Put,
  Req,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from "@nestjs/swagger"
import { Throttle } from "@nestjs/throttler"
import type { Response, Request } from "express"
import type { ChatService } from "./chat.service"
import { AuthGuard } from "../auth/guards/auth.guard"
import type { ChatCompletionDto } from "./dto/chat-completion.dto"
import type { ChatStreamDto } from "./dto/chat-stream.dto"
import type { CreateSessionDto } from "./dto/create-session.dto"
import type { SessionChatDto } from "./dto/session-chat.dto"

@ApiTags("Chat")
@ApiSecurity("api-key")
@Controller("chat")
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("completion")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: "Generate chat completion" })
  @ApiResponse({ status: 200, description: "Chat completion generated successfully" })
  async createCompletion(@Body() chatCompletionDto: ChatCompletionDto, @Req() req: Request): Promise<any> {
    return this.chatService.createCompletion(chatCompletionDto, req.user)
  }

  @Post("stream")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Generate streaming chat completion" })
  async createStreamCompletion(@Body() chatStreamDto: ChatStreamDto, @Res() res: Response, @Req() req: Request) {
    return this.chatService.createStreamCompletion(chatStreamDto, res, req.user)
  }

  @Post("sessions")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new chat session" })
  @ApiResponse({ status: 201, description: "Chat session created successfully" })
  async createSession(@Body() createSessionDto: CreateSessionDto, @Req() req: Request) {
    return this.chatService.createSession(createSessionDto, req.user.id)
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get user chat sessions' })
  @ApiResponse({ status: 200, description: 'Chat sessions retrieved successfully' })
  async getUserSessions(@Req() req: Request) {
    return this.chatService.getUserSessions(req.user.id)
  }

  @Get("sessions/:sessionId")
  @ApiOperation({ summary: "Get chat session with messages" })
  @ApiResponse({ status: 200, description: "Chat session retrieved successfully" })
  async getSession(@Param('sessionId') sessionId: string, @Req() req: Request) {
    return this.chatService.getSessionWithMessages(sessionId, req.user.id)
  }

  @Post("sessions/:sessionId/messages")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: "Send message in a chat session" })
  @ApiResponse({ status: 200, description: "Message sent successfully" })
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() sessionChatDto: SessionChatDto,
    @Req() req: Request,
  ) {
    return this.chatService.sendMessageInSession(sessionId, sessionChatDto, req.user)
  }

  @Put("sessions/:sessionId/title")
  @ApiOperation({ summary: "Update session title" })
  @ApiResponse({ status: 200, description: "Session title updated successfully" })
  async updateSessionTitle(@Param('sessionId') sessionId: string, @Body('title') title: string, @Req() req: Request) {
    return this.chatService.updateSessionTitle(sessionId, req.user.id, title)
  }

  @Delete("sessions/:sessionId")
  @ApiOperation({ summary: "Delete chat session" })
  @ApiResponse({ status: 200, description: "Session deleted successfully" })
  async deleteSession(@Param('sessionId') sessionId: string, @Req() req: Request) {
    return this.chatService.deleteSession(sessionId, req.user.id)
  }
}
