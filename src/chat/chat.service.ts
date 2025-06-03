import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common"
import type { Response } from "express"
import type { OpenAIService } from "./services/openai.service"
import type { ChatCompletionDto } from "./dto/chat-completion.dto"
import type { ChatStreamDto } from "./dto/chat-stream.dto"

@Injectable()
export class ChatService {
  constructor(private readonly openaiService: OpenAIService) {}

  async createCompletion(chatCompletionDto: ChatCompletionDto) {
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

  async createStreamCompletion(chatStreamDto: ChatStreamDto, res: Response) {
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
}
