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
      messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          content: string
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          content: string
          type?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          content?: string
          type?: string
          created_at?: string
        }
        Relationships: []
      }
      waiting_users: {
        Row: {
          user_id: string
          interests: string[]
          language: string
          age_group: string
          created_at: string
        }
        Insert: {
          user_id: string
          interests: string[]
          language: string
          age_group: string
          created_at?: string
        }
        Update: {
          user_id?: string
          interests?: string[]
          language?: string
          age_group?: string
          created_at?: string
        }
        Relationships: []
      }
      anonymous_sessions: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          status: string
          created_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          status?: string
          created_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          status?: string
          created_at?: string
          ended_at?: string | null
        }
        Relationships: []
      }
      call_signals: {
        Row: {
          id: string
          session_id: string
          from_user_id: string
          to_user_id: string
          signal_type: string
          signal_data: Json
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          from_user_id: string
          to_user_id: string
          signal_type: string
          signal_data: Json
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          from_user_id?: string
          to_user_id?: string
          signal_type?: string
          signal_data?: Json
          created_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      voice_messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          file_path: string
          file_url: string
          duration: number
          file_size: number
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          file_path: string
          file_url: string
          duration: number
          file_size: number
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          file_path?: string
          file_url?: string
          duration?: number
          file_size?: number
          created_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          reporter_user_id: string
          reported_user_id: string | null
          session_id: string | null
          reason: string
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_user_id: string
          reported_user_id?: string | null
          session_id?: string | null
          reason: string
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_user_id?: string
          reported_user_id?: string | null
          session_id?: string | null
          reason?: string
          details?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      matchmake: {
        Args: {
          p_user_id: string
          p_interests: string[]
          p_language: string
          p_age_group: string
        }
        Returns: {
          success: boolean
          status: string
          session_id: string | null
          partner_user_id: string | null
          partner_interests: string[] | null
          partner_language: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
