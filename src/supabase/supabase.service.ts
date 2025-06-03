import { Injectable, Logger } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name)
  private supabase: SupabaseClient

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>("NEXT_PUBLIC_SUPABASE_URL")
    const supabaseServiceKey = this.configService.get<string>("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing")
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    this.logger.log("Supabase client initialized")
  }

  getClient(): SupabaseClient {
    return this.supabase
  }

  // Create a client-specific instance for user operations
  createUserClient(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.get<string>("NEXT_PUBLIC_SUPABASE_URL")
    const supabaseAnonKey = this.configService.get<string>("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    })
  }
}
