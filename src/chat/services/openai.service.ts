import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { Response } from "express"
import { openai } from "@ai-sdk/openai"
import { generateText, streamText } from "ai"
import type { ChatCompletionDto } from "../dto/chat-completion.dto"
import type { ChatStreamDto } from "../dto/chat-stream.dto"

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name)

  constructor(private configService: ConfigService) {}

  async generateText(chatCompletionDto: ChatCompletionDto) {
    const { messages, model, temperature, maxTokens } = chatCompletionDto

    this.logger.log(`Generating text completion for ${messages.length} messages`)

    try {
      const result = await generateText({
        model: openai(model || this.configService.get("openai.model")),
        messages: messages.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
        temperature: temperature ?? this.configService.get("openai.temperature"),
        maxTokens: maxTokens ?? this.configService.get("openai.maxTokens"),
      })

      this.logger.log("Text completion generated successfully")
      return result
    } catch (error) {
      this.logger.error("Failed to generate text completion", error.stack)
      throw error
    }
  }

  async streamText(chatStreamDto: ChatStreamDto, res: Response) {
    const { messages, model, temperature, maxTokens } = chatStreamDto

    this.logger.log(`Starting streaming completion for ${messages.length} messages`)

    try {
      const result = streamText({
        model: openai(model || this.configService.get("openai.model")),
        messages: messages.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
        temperature: temperature ?? this.configService.get("openai.temperature"),
        maxTokens: maxTokens ?? this.configService.get("openai.maxTokens"),
      })

      // Set appropriate headers for streaming
      res.setHeader("Content-Type", "text/plain; charset=utf-8")
      res.setHeader("Cache-Control", "no-cache")
      res.setHeader("Connection", "keep-alive")

      // Use AI SDK's built-in response streaming
      result.pipeDataStreamToResponse(res)

      this.logger.log("Streaming completion started successfully")
    } catch (error) {
      this.logger.error("Failed to start streaming completion", error.stack)
      throw error
    }
  }
}
