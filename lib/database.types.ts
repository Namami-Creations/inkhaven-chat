export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      anonymous_sessions: {
        Row: {
          id: string
          users: string[]
          interests: string[]
          quality_score: number
          ai_generated_name: string | null
          started_at: string
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          users: string[]
          interests?: string[]
          quality_score?: number
          ai_generated_name?: string | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          users?: string[]
          interests?: string[]
          quality_score?: number
          ai_generated_name?: string | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          is_ai_generated: boolean
          is_premium_only: boolean
          participant_count: number
          max_participants: number
          current_participants: number
          interests: string[]
          moderation_rules: Json
          room_avatar_data: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          is_ai_generated?: boolean
          is_premium_only?: boolean
          participant_count?: number
          max_participants?: number
          current_participants?: number
          interests?: string[]
          moderation_rules?: Json
          room_avatar_data?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          is_ai_generated?: boolean
          is_premium_only?: boolean
          participant_count?: number
          max_participants?: number
          current_participants?: number
          interests?: string[]
          moderation_rules?: Json
          room_avatar_data?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          id: string
          name: string
          category: string
          popularity_score: number
          emoji: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          popularity_score?: number
          emoji?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          popularity_score?: number
          emoji?: string | null
          color?: string | null
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          session_id: string | null
          room_id: string | null
          user_id: string
          content: string
          message_type: 'text' | 'image' | 'file' | 'voice' | 'giphy'
          file_url: string | null
          giphy_data: Json | null
          reactions: Json
          is_moderated: boolean
          moderation_reason: string | null
          ai_enhanced: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          room_id?: string | null
          user_id: string
          content: string
          message_type?: 'text' | 'image' | 'file' | 'voice' | 'giphy'
          file_url?: string | null
          giphy_data?: Json | null
          reactions?: Json
          is_moderated?: boolean
          moderation_reason?: string | null
          ai_enhanced?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          room_id?: string | null
          user_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'file' | 'voice' | 'giphy'
          file_url?: string | null
          giphy_data?: Json | null
          reactions?: Json
          is_moderated?: boolean
          moderation_reason?: string | null
          ai_enhanced?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "anonymous_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      paypal_webhooks: {
        Row: {
          id: string
          webhook_id: string
          event_type: string
          resource_type: string
          resource_id: string
          resource_data: Json
          processed: boolean
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          webhook_id: string
          event_type: string
          resource_type: string
          resource_id: string
          resource_data: Json
          processed?: boolean
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          webhook_id?: string
          event_type?: string
          resource_type?: string
          resource_id?: string
          resource_data?: Json
          processed?: boolean
          processed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      room_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string
          user_tier: Database["public"]["Enums"]["user_tier"]
          role: 'member' | 'moderator' | 'admin'
          joined_at: string
          left_at: string | null
          last_activity: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          user_tier?: Database["public"]["Enums"]["user_tier"]
          role?: 'member' | 'moderator' | 'admin'
          joined_at?: string
          left_at?: string | null
          last_activity?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          user_tier?: Database["public"]["Enums"]["user_tier"]
          role?: 'member' | 'moderator' | 'admin'
          joined_at?: string
          left_at?: string | null
          last_activity?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_key: string
          title: string
          description: string | null
          icon_url: string | null
          unlocked_at: string
          progress: number
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_key: string
          title: string
          description?: string | null
          icon_url?: string | null
          unlocked_at?: string
          progress?: number
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_key?: string
          title?: string
          description?: string | null
          icon_url?: string | null
          unlocked_at?: string
          progress?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_entertainment: {
        Row: {
          id: string
          user_id: string
          entertainment_type: string
          result_data: Json
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entertainment_type: string
          result_data: Json
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          user_id?: string
          entertainment_type?: string
          result_data?: Json
          created_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entertainment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          paypal_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier: string
          amount: number
          currency: string
          interval: string
          current_period_start: string | null
          current_period_end: string | null
          trial_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          paypal_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier: string
          amount: number
          currency?: string
          interval?: string
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          paypal_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: string
          amount?: number
          currency?: string
          interval?: string
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_usage: {
        Row: {
          id: string
          user_id: string
          feature_type: string
          usage_count: number
          limit_count: number
          reset_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature_type: string
          usage_count?: number
          limit_count: number
          reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feature_type?: string
          usage_count?: number
          limit_count?: number
          reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          anonymous_id: string | null
          email: string | null
          display_name: string | null
          avatar_data: Json
          bio: string | null
          interests: string[]
          personality_traits: Json
          preferences: Json
          user_tier: Database["public"]["Enums"]["user_tier"]
          is_registered: boolean
          is_verified: boolean
          join_date: string
          total_messages_sent: number
          total_time_online: string
          reputation_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          anonymous_id?: string | null
          email?: string | null
          display_name?: string | null
          avatar_data?: Json
          bio?: string | null
          interests?: string[]
          personality_traits?: Json
          preferences?: Json
          user_tier?: Database["public"]["Enums"]["user_tier"]
          is_registered?: boolean
          is_verified?: boolean
          join_date?: string
          total_messages_sent?: number
          total_time_online?: string
          reputation_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          anonymous_id?: string | null
          email?: string | null
          display_name?: string | null
          avatar_data?: Json
          bio?: string | null
          interests?: string[]
          personality_traits?: Json
          preferences?: Json
          user_tier?: Database["public"]["Enums"]["user_tier"]
          is_registered?: boolean
          is_verified?: boolean
          join_date?: string
          total_messages_sent?: number
          total_time_online?: string
          reputation_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_status: "active" | "inactive" | "cancelled" | "past_due" | "trialing"
      user_tier: "anonymous" | "registered_free" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
