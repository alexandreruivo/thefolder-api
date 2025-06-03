import { Injectable, type CanActivate, type ExecutionContext, UnauthorizedException } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { Request } from "express"

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const apiKey = request.headers["x-api-key"] as string

    if (!apiKey) {
      throw new UnauthorizedException("API key is required")
    }

    const validApiKeys = this.configService.get<string[]>("auth.apiKeys")

    if (!validApiKeys || !validApiKeys.includes(apiKey)) {
      throw new UnauthorizedException("Invalid API key")
    }

    return true
  }
}
