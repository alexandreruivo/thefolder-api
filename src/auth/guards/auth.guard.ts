import { Injectable, type CanActivate, type ExecutionContext, UnauthorizedException } from "@nestjs/common"
import type { AuthService } from "../auth.service"
import type { Request } from "express"

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    // Check for API key first
    const apiKey = request.headers["x-api-key"] as string
    if (apiKey) {
      const authResult = await this.authService.validateApiKey(apiKey)
      request.user = authResult.user
      request.apiKey = authResult.apiKey
      return true
    }

    // Check for Bearer token
    const authHeader = request.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      const authResult = await this.authService.validateBearerToken(token)
      request.user = authResult.user
      request.authUser = authResult.authUser
      return true
    }

    throw new UnauthorizedException("Authentication required")
  }
}
