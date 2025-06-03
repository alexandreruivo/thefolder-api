import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from "@nestjs/swagger"
import { AuthGuard } from "../auth/guards/auth.guard"
import type { UsersService } from "./users.service"

@ApiTags("Users")
@ApiSecurity("api-key")
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@Req() req: any) {
    return this.usersService.getUserProfile(req.user.id)
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'Get user API keys' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async getApiKeys(@Req() req: any) {
    return this.usersService.getUserApiKeys(req.user.id)
  }

  @Post("api-keys")
  @ApiOperation({ summary: "Generate new API key" })
  @ApiResponse({ status: 201, description: "API key generated successfully" })
  async generateApiKey(@Body('name') name: string, @Req() req: any) {
    return this.usersService.generateApiKey(req.user.id, name)
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics retrieved successfully' })
  async getUsage(@Req() req: any) {
    return this.usersService.getUsageStats(req.user.id)
  }
}
