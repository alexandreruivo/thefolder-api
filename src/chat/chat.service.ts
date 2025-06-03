import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common"
import type { Response } from "express"
import type { OpenAIService } from "./services/openai.service"
import type { DatabaseService } from "./services/database.service"
import type { AuthService } from "../auth/auth.service"
import type { ChatCompletionDto } from "./dto/chat-completion.dto"
import type { ChatStreamDto } from "./dto/chat-stream.dto"
import type { CreateSessionDto } from "./dto/create-session.dto"
import type { SessionChatDto } from "./dto/session-chat.dto"

@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenAIService,
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
  ) {}

  async createCompletion(chatCompletionDto: ChatCompletionDto, user: any) {
    // Check usage limits
    const estimatedTokens = this.estimateTokens(chatCompletionDto.messages)
    const canUse = await this.authService.checkUsageLimit(user.id, estimatedTokens)

    if (!canUse) {
      throw new ForbiddenException("Monthly usage limit exceeded")
    }

    try {
      const result = await this.openaiService.generateText(chatCompletionDto)

      return {
        success: true,
        data: {
          id: `chatcmpl-${Date.now()}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: chatCompletionDto.model || "gpt-4o",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: result.text,
              },
              finish_reason: result.finishReason,
            },
          ],
          usage: result.usage,
        },
      }
    } catch (error) {
      if (error.message?.includes("rate limit")) {
        throw new BadRequestException("Rate limit exceeded. Please try again later.")
      }

      if (error.message?.includes("insufficient_quota")) {
        throw new BadRequestException("OpenAI API quota exceeded.")
      }

      throw new InternalServerErrorException("Failed to generate completion")
    }
  }

  async createStreamCompletion(chatStreamDto: ChatStreamDto, res: Response, user: any) {
    // Check usage limits
    const estimatedTokens = this.estimateTokens(chatStreamDto.messages)
    const canUse = await this.authService.checkUsageLimit(user.id, estimatedTokens)

    if (!canUse) {
      res.status(403).json({ error: "Monthly usage limit exceeded" })
      return
    }

    try {
      await this.openaiService.streamText(chatStreamDto, res)
    } catch (error) {
      if (error.message?.includes("rate limit")) {
        res.status(429).json({ error: "Rate limit exceeded. Please try again later." })
        return
      }

      if (error.message?.includes("insufficient_quota")) {
        res.status(400).json({ error: "OpenAI API quota exceeded." })
        return
      }

      res.status(500).json({ error: "Failed to generate streaming completion" })
    }
  }

  async createSession(createSessionDto: CreateSessionDto, userId: string) {
    try {
      const session = await this.databaseService.createChatSession(
        userId,
        createSessionDto.title,
        createSessionDto.model || "gpt-4o",
        createSessionDto.systemPrompt,
      )

      return {
        success: true,
        data: session,
      }
    } catch (error) {
      throw new InternalServerErrorException("Failed to create chat session")
    }
  }

  async getUserSessions(userId: string) {
    try {
      const sessions = await this.databaseService.getUserChatSessions(userId)
      return {
        success: true,
        data: sessions,
      }
    } catch (error) {
      throw new InternalServerErrorException("Failed to retrieve chat sessions")
    }
  }

  async getSessionWithMessages(sessionId: string, userId: string) {
    try {
      const session = await this.databaseService.getChatSession(sessionId, userId)
      if (!session) {
        throw new NotFoundException("Chat session not found")
      }

      const messages = await this.databaseService.getSessionMessages(sessionId)

      return {
        success: true,
        data: {
          session,
          messages,
        },
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException("Failed to retrieve chat session")
    }
  }

  async sendMessageInSession(sessionId: string, sessionChatDto: SessionChatDto, user: any) {
    try {
      // Verify session belongs to user
      const session = await this.databaseService.getChatSession(sessionId, user.id)
      if (!session) {
        throw new NotFoundException("Chat session not found")
      }

      // Check usage limits
      const estimatedTokens = this.estimateTokens([{ role: "user", content: sessionChatDto.message }])
      const canUse = await this.authService.checkUsageLimit(user.id, estimatedTokens)

      if (!canUse) {
        throw new ForbiddenException("Monthly usage limit exceeded")
      }

      // Add user message to session
      await this.databaseService.addMessageToSession(sessionId, "user", sessionChatDto.message, estimatedTokens)

      // Get conversation history
      const messages = await this.databaseService.getSessionMessages(sessionId)

      // Prepare messages for OpenAI
      const openaiMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Add system prompt if exists
      if (session.system_prompt) {
        openaiMessages.unshift({
          role: "system",
          content: session.system_prompt,
        })
      }

      // Generate AI response
      const result = await this.openaiService.generateText({
        messages: openaiMessages,
        model: session.model,
        temperature: sessionChatDto.temperature,
        maxTokens: sessionChatDto.maxTokens,
      })

      // Add AI response to session
      const aiMessage = await this.databaseService.addMessageToSession(
        sessionId,
        "assistant",
        result.text,
        result.usage?.totalTokens || 0,
        { usage: result.usage },
      )

      return {
        success: true,
        data: {
          userMessage: {
            role: "user",
            content: sessionChatDto.message,
          },
          aiMessage: {
            role: "assistant",
            content: result.text,
          },
          usage: result.usage,
        },
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      throw new InternalServerErrorException("Failed to send message")
    }
  }

  async updateSessionTitle(sessionId: string, userId: string, title: string) {
    try {
      await this.databaseService.updateSessionTitle(sessionId, userId, title)
      return {
        success: true,
        message: "Session title updated successfully",
      }
    } catch (error) {
      throw new InternalServerErrorException("Failed to update session title")
    }
  }

  async deleteSession(sessionId: string, userId: string) {
    try {
      await this.databaseService.deleteSession(sessionId, userId)
      return {
        success: true,
        message: "Session deleted successfully",
      }
    } catch (error) {
      throw new InternalServerErrorException("Failed to delete session")
    }
  }

  private estimateTokens(messages: any[]): number {
    // Simple token estimation (roughly 4 characters per token)
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0)
    return Math.ceil(totalChars / 4)
  }
}
