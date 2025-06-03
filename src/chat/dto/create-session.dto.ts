import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsOptional, MaxLength } from "class-validator"

export class CreateSessionDto {
  @ApiProperty({ description: "Title for the chat session" })
  @IsString()
  @MaxLength(100)
  title: string

  @ApiProperty({ required: false, default: "gpt-4o" })
  @IsOptional()
  @IsString()
  model?: string

  @ApiProperty({ required: false, description: "System prompt for the session" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  systemPrompt?: string
}
