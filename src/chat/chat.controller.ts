import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Res } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from "@nestjs/swagger"
import { Throttle } from "@nestjs/throttler"
import type { Response } from "express"
import type { ChatService } from "./chat.service"
import { AuthGuard } from "../auth/guards/auth.guard"
import type { ChatCompletionDto } from "./dto/chat-completion.dto"
import type { ChatStreamDto } from "./dto/chat-stream.dto"

@ApiTags("Chat")
@ApiSecurity("api-key")
@Controller("chat")
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('completion')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for completion
  @ApiOperation({ summary: 'Generate chat completion' })
  @ApiResponse({ status: 200, description: 'Chat completion generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async createCompletion(@Body() chatCompletionDto: ChatCompletionDto) {
    return this.chatService.createCompletion(chatCompletionDto);
  }

  @Post("stream")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute for streaming
  @ApiOperation({ summary: "Generate streaming chat completion" })
  @ApiResponse({ status: 200, description: "Streaming chat completion started" })
  async createStreamCompletion(@Body() chatStreamDto: ChatStreamDto, @Res() res: Response) {
    return this.chatService.createStreamCompletion(chatStreamDto, res)
  }
}
