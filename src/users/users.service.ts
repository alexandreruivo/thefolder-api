import { Injectable, Logger } from "@nestjs/common"
import type { SupabaseService } from "../supabase/supabase.service"
import type { AuthService } from "../auth/auth.service"

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
  ) {}

  async getUserProfile(userId: string) {
    try {
      const { data: user, error } = await this.supabaseService
        .getClient()
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        throw new Error("Failed to get user profile")
      }

      return {
        success: true,
        data: user,
      }
    } catch (error) {
      this.logger.error("Failed to get user profile", error.stack)
      throw error
    }
  }

  async getUserApiKeys(userId: string) {
    try {
      const { data: apiKeys, error } = await this.supabaseService
        .getClient()
        .from("api_keys")
        .select("id, key_name, created_at, last_used_at, expires_at, is_active, usage_count, rate_limit_per_minute")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error("Failed to get API keys")
      }

      return {
        success: true,
        data: apiKeys,
      }
    } catch (error) {
      this.logger.error("Failed to get user API keys", error.stack)
      throw error
    }
  }

  async generateApiKey(userId: string, keyName: string) {
    try {
      const apiKey = await this.authService.generateApiKey(userId, keyName)

      return {
        success: true,
        data: {
          apiKey,
          message: "API key generated successfully. Please store it securely as it will not be shown again.",
        },
      }
    } catch (error) {
      this.logger.error("Failed to generate API key", error.stack)
      throw error
    }
  }

  async getUsageStats(userId: string) {
    try {
      // Get user usage info
      const { data: user, error: userError } = await this.supabaseService
        .getClient()
        .from("users")
        .select("monthly_usage_limit, current_monthly_usage, usage_reset_date, subscription_tier")
        .eq("id", userId)
        .single()

      if (userError) {
        throw new Error("Failed to get user usage data")
      }

      // Get session count
      const { count: sessionCount, error: sessionError } = await this.supabaseService
        .getClient()
        .from("chat_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_active", true)

      if (sessionError) {
        throw new Error("Failed to get session count")
      }

      // Get total message count
      const { count: messageCount, error: messageError } = await this.supabaseService
        .getClient()
        .from("chat_messages")
        .select("session_id", { count: "exact", head: true })
        .in(
          "session_id",
          this.supabaseService
            .getClient()
            .from("chat_sessions")
            .select("id")
            .eq("user_id", userId)
            .eq("is_active", true),
        )

      if (messageError) {
        throw new Error("Failed to get message count")
      }

      return {
        success: true,
        data: {
          usage: {
            current: user.current_monthly_usage,
            limit: user.monthly_usage_limit,
            percentage: Math.round((user.current_monthly_usage / user.monthly_usage_limit) * 100),
            resetDate: user.usage_reset_date,
          },
          subscription: user.subscription_tier,
          stats: {
            totalSessions: sessionCount || 0,
            totalMessages: messageCount || 0,
          },
        },
      }
    } catch (error) {
      this.logger.error("Failed to get usage stats", error.stack)
      throw error
    }
  }
}
