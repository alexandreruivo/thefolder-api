import { Injectable, UnauthorizedException, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import type { SupabaseService } from "../supabase/supabase.service"
import * as crypto from "crypto"

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  async validateApiKey(apiKey: string): Promise<any> {
    try {
      // Hash the provided API key
      const hashedKey = this.hashApiKey(apiKey)

      const { data: apiKeyRecord, error } = await this.supabaseService
        .getClient()
        .from("api_keys")
        .select(`
          *,
          users (
            id,
            email,
            full_name,
            is_active,
            subscription_tier,
            monthly_usage_limit,
            current_monthly_usage
          )
        `)
        .eq("key_hash", hashedKey)
        .eq("is_active", true)
        .single()

      if (error || !apiKeyRecord) {
        throw new UnauthorizedException("Invalid API key")
      }

      // Check if API key is expired
      if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
        throw new UnauthorizedException("API key has expired")
      }

      // Check if user is active
      if (!apiKeyRecord.users.is_active) {
        throw new UnauthorizedException("User account is inactive")
      }

      // Update last used timestamp and usage count
      await this.supabaseService
        .getClient()
        .from("api_keys")
        .update({
          last_used_at: new Date().toISOString(),
          usage_count: apiKeyRecord.usage_count + 1,
        })
        .eq("id", apiKeyRecord.id)

      return {
        apiKey: apiKeyRecord,
        user: apiKeyRecord.users,
      }
    } catch (error) {
      this.logger.error("API key validation failed", error.stack)
      throw new UnauthorizedException("Invalid API key")
    }
  }

  async validateBearerToken(token: string): Promise<any> {
    try {
      const userClient = this.supabaseService.createUserClient(token)

      const {
        data: { user },
        error,
      } = await userClient.auth.getUser()

      if (error || !user) {
        throw new UnauthorizedException("Invalid bearer token")
      }

      // Get user profile from our users table
      const { data: userProfile, error: profileError } = await this.supabaseService
        .getClient()
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError || !userProfile) {
        throw new UnauthorizedException("User profile not found")
      }

      if (!userProfile.is_active) {
        throw new UnauthorizedException("User account is inactive")
      }

      return {
        user: userProfile,
        authUser: user,
      }
    } catch (error) {
      this.logger.error("Bearer token validation failed", error.stack)
      throw new UnauthorizedException("Invalid bearer token")
    }
  }

  async generateApiKey(userId: string, keyName: string): Promise<string> {
    // Generate a random API key
    const apiKey = `sk-${crypto.randomBytes(32).toString("hex")}`
    const hashedKey = this.hashApiKey(apiKey)

    const { error } = await this.supabaseService.getClient().from("api_keys").insert({
      user_id: userId,
      key_hash: hashedKey,
      key_name: keyName,
      rate_limit_per_minute: 20, // Default rate limit
    })

    if (error) {
      throw new Error("Failed to create API key")
    }

    return apiKey
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash("sha256").update(apiKey).digest("hex")
  }

  async checkUsageLimit(userId: string, tokensToUse: number): Promise<boolean> {
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from("users")
      .select("monthly_usage_limit, current_monthly_usage")
      .eq("id", userId)
      .single()

    if (error || !user) {
      return false
    }

    return user.current_monthly_usage + tokensToUse <= user.monthly_usage_limit
  }
}
