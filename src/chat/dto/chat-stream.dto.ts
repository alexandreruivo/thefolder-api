import { ApiProperty } from "@nestjs/swagger"
import { IsArray, IsOptional, IsString, IsNumber, Min, Max, ValidateNested } from "class-validator"
import { Type } from "class-transformer"

class MessageDto {
  @ApiProperty({ enum: ["system", "user", "assistant"] })
  @IsString()
  role: "system" | "user" | "assistant"

  @ApiProperty()
  @IsString()
  content: string
}

export class ChatStreamDto {
  @ApiProperty({ type: [MessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[]

  @ApiProperty({ required: false, default: "gpt-4o" })
  @IsOptional()
  @IsString()
  model?: string

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
