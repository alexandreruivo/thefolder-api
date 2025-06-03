import { Injectable, Logger } from "@nestjs/common"
import type { SupabaseService } from "../../supabase/supabase.service"

export interface ChatSession {
  id: string
  user_id: string
  title: string
  model: string
  system_prompt?: string
  created_at: string
  updated_at: string
  is_active: boolean
  total_tokens_used: number
  message_count: number
}

export interface ChatMessage {
  id: string
  session_id: string
  role: "system" | "user" | "assistant"
  content: string
  tokens_used: number
  created_at: string
  metadata?: any
}

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name)

  constructor(private supabaseService: SupabaseService) {}

  async createChatSession(userId: string, title: string, model: string, systemPrompt?: string): Promise<ChatSession> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("chat_sessions")
      .insert({
        user_id: userId,
        title,
        model,
        system_prompt: systemPrompt,
      })
      .select()
      .single()

    if (error) {
      this.logger.error("Failed to create chat session", error)
      throw new Error("Failed to create chat session")
    }

    return data
  }

  async getChatSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single()

    if (error) {
      this.logger.error("Failed to get chat session", error)
      return null
    }

    return data
  }

  async getUserChatSessions(userId: string, limit = 50): Promise<ChatSession[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (error) {
      this.logger.error("Failed to get user chat sessions", error)
      return []
    }

    return data || []
  }

  async addMessageToSession(
    sessionId: string,
    role: "system" | "user" | "assistant",
    content: string,
    tokensUsed: number,
    metadata?: any,
  ): Promise<ChatMessage> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role,
        content,
        tokens_used: tokensUsed,
        metadata,
      })
      .select()
      .single()

    if (error) {
      this.logger.error("Failed to add message to session", error)
      throw new Error("Failed to add message to session")
    }

    return data
  }

  async getSessionMessages(sessionId: string, limit = 100): Promise<ChatMessage[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit)

    if (error) {
      this.logger.error("Failed to get session messages", error)
      return []
    }

    return data || []
  }

  async updateSessionTitle(sessionId: string, userId: string, title: string): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from("chat_sessions")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", userId)

    if (error) {
      this.logger.error("Failed to update session title", error)
      throw new Error("Failed to update session title")
    }
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from("chat_sessions")
      .update({ is_active: false })
      .eq("id", sessionId)
      .eq("user_id", userId)

    if (error) {
      this.logger.error("Failed to delete session", error)
      throw new Error("Failed to delete session")
    }
  }
}
