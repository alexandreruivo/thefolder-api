import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsUUID, IsOptional, IsNumber, Min, Max } from "class-validator"

class MessageDto {
  @ApiProperty({ enum: ["system", "user", "assistant"] })
  @IsString()
  role: "system" | "user" | "assistant"

  @ApiProperty()
  @IsString()
  content: string
}

export class SessionChatDto {
  @ApiProperty({ description: "Chat session ID" })
  @IsUUID()
  sessionId: string

  @ApiProperty({ description: "User message content" })
  @IsString()
  message: string

  @ApiProperty({ required: false, minimum: 0, maximum: 2, default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number

  @ApiProperty({ required: false, minimum: 1, maximum: 4000, default: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number
}
