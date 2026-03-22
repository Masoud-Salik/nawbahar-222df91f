export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          ai_score_ethics: number | null
          ai_score_innovation: number | null
          ai_score_science: number | null
          ai_score_timing: number | null
          ai_score_writing: number | null
          author_id: string
          comment_count: number
          content: string
          cover_image_url: string | null
          created_at: string
          editorial_score_ethics: number | null
          editorial_score_innovation: number | null
          editorial_score_science: number | null
          editorial_score_timing: number | null
          editorial_score_writing: number | null
          embedding: string | null
          engagement_score: number | null
          final_weight: number | null
          id: string
          parent_article_id: string | null
          reaction_count: number
          read_count: number | null
          save_count: number | null
          scheduled_at: string | null
          share_count: number | null
          status: Database["public"]["Enums"]["article_status"]
          tags: string[] | null
          title: string
          total_feed_rank: number | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          ai_score_ethics?: number | null
          ai_score_innovation?: number | null
          ai_score_science?: number | null
          ai_score_timing?: number | null
          ai_score_writing?: number | null
          author_id: string
          comment_count?: number
          content: string
          cover_image_url?: string | null
          created_at?: string
          editorial_score_ethics?: number | null
          editorial_score_innovation?: number | null
          editorial_score_science?: number | null
          editorial_score_timing?: number | null
          editorial_score_writing?: number | null
          embedding?: string | null
          engagement_score?: number | null
          final_weight?: number | null
          id?: string
          parent_article_id?: string | null
          reaction_count?: number
          read_count?: number | null
          save_count?: number | null
          scheduled_at?: string | null
          share_count?: number | null
          status?: Database["public"]["Enums"]["article_status"]
          tags?: string[] | null
          title: string
          total_feed_rank?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          ai_score_ethics?: number | null
          ai_score_innovation?: number | null
          ai_score_science?: number | null
          ai_score_timing?: number | null
          ai_score_writing?: number | null
          author_id?: string
          comment_count?: number
          content?: string
          cover_image_url?: string | null
          created_at?: string
          editorial_score_ethics?: number | null
          editorial_score_innovation?: number | null
          editorial_score_science?: number | null
          editorial_score_timing?: number | null
          editorial_score_writing?: number | null
          embedding?: string | null
          engagement_score?: number | null
          final_weight?: number | null
          id?: string
          parent_article_id?: string | null
          reaction_count?: number
          read_count?: number | null
          save_count?: number | null
          scheduled_at?: string | null
          share_count?: number | null
          status?: Database["public"]["Enums"]["article_status"]
          tags?: string[] | null
          title?: string
          total_feed_rank?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_parent_article_id_fkey"
            columns: ["parent_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      citations: {
        Row: {
          cited_article_id: string
          created_at: string
          id: string
          source_article_id: string
        }
        Insert: {
          cited_article_id: string
          created_at?: string
          id?: string
          source_article_id: string
        }
        Update: {
          cited_article_id?: string
          created_at?: string
          id?: string
          source_article_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "citations_cited_article_id_fkey"
            columns: ["cited_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citations_source_article_id_fkey"
            columns: ["source_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          article_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          like_count: number | null
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number | null
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number | null
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          article_id: string | null
          created_at: string
          id: string
          is_read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          article_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          article_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          profile_id: string
          reviewer_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          profile_id: string
          reviewer_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          profile_id?: string
          reviewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          facebook_url: string | null
          id: string
          interests: string[] | null
          linkedin_url: string | null
          real_name: string | null
          reputation_score: number | null
          specialty: string | null
          trust_score: number | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          facebook_url?: string | null
          id: string
          interests?: string[] | null
          linkedin_url?: string | null
          real_name?: string | null
          reputation_score?: number | null
          specialty?: string | null
          trust_score?: number | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          facebook_url?: string | null
          id?: string
          interests?: string[] | null
          linkedin_url?: string | null
          real_name?: string | null
          reputation_score?: number | null
          specialty?: string | null
          trust_score?: number | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          article_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      reported_comments: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reason: string | null
          reporter_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reported_comments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          link_label: string | null
          link_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          link_label?: string | null
          link_url?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          link_label?: string | null
          link_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          id: string
          user_id: string | null
          device_id: string
          device_type: string | null
          device_model: string | null
          os_name: string | null
          os_version: string | null
          browser_name: string | null
          browser_version: string | null
          screen_width: number | null
          screen_height: number | null
          user_type: string
          is_pwa_installed: boolean
          installed_at: string | null
          app_version: string | null
          first_visit_at: string
          first_visit_url: string | null
          first_visit_referrer: string | null
          country_code: string | null
          timezone: string | null
          language: string | null
          last_seen_at: string
          last_active_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          device_id: string
          device_type?: string | null
          device_model?: string | null
          os_name?: string | null
          os_version?: string | null
          browser_name?: string | null
          browser_version?: string | null
          screen_width?: number | null
          screen_height?: number | null
          user_type?: string
          is_pwa_installed?: boolean
          installed_at?: string | null
          app_version?: string | null
          first_visit_at?: string
          first_visit_url?: string | null
          first_visit_referrer?: string | null
          country_code?: string | null
          timezone?: string | null
          language?: string | null
          last_seen_at?: string
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          device_id?: string
          device_type?: string | null
          device_model?: string | null
          os_name?: string | null
          os_version?: string | null
          browser_name?: string | null
          browser_version?: string | null
          screen_width?: number | null
          screen_height?: number | null
          user_type?: string
          is_pwa_installed?: boolean
          installed_at?: string | null
          app_version?: string | null
          first_visit_at?: string
          first_visit_url?: string | null
          first_visit_referrer?: string | null
          country_code?: string | null
          timezone?: string | null
          language?: string | null
          last_seen_at?: string
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_presence: {
        Row: {
          user_id: string
          device_id: string
          session_id: string
          status: string
          last_seen_at: string
          last_activity_at: string
          current_activity: string | null
          current_entity_id: string | null
          heartbeat_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          device_id: string
          session_id: string
          status?: string
          last_seen_at?: string
          last_activity_at?: string
          current_activity?: string | null
          current_entity_id?: string | null
          heartbeat_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          device_id?: string
          session_id?: string
          status?: string
          last_seen_at?: string
          last_activity_at?: string
          current_activity?: string | null
          current_entity_id?: string | null
          heartbeat_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string | null
          device_id: string
          session_token: string
          is_active: boolean
          started_at: string
          ended_at: string | null
          last_heartbeat_at: string
          duration_seconds: number | null
          ip_address: unknown | null
          user_agent: string | null
          entry_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          device_id: string
          session_token: string
          is_active?: boolean
          started_at?: string
          ended_at?: string | null
          last_heartbeat_at?: string
          duration_seconds?: number | null
          ip_address?: unknown | null
          user_agent?: string | null
          entry_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          device_id?: string
          session_token?: string
          is_active?: boolean
          started_at?: string
          ended_at?: string | null
          last_heartbeat_at?: string
          duration_seconds?: number | null
          ip_address?: unknown | null
          user_agent?: string | null
          entry_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          device_id: string | null
          session_id: string | null
          activity_type: Database["public"]["Enums"]["activity_type"]
          activity_category: string
          entity_id: string | null
          entity_type: string | null
          metadata: Json | null
          url: string | null
          referrer: string | null
          time_spent_seconds: number | null
          created_at: string
          created_date: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          device_id?: string | null
          session_id?: string | null
          activity_type: Database["public"]["Enums"]["activity_type"]
          activity_category?: string
          entity_id?: string | null
          entity_type?: string | null
          metadata?: Json | null
          url?: string | null
          referrer?: string | null
          time_spent_seconds?: number | null
          created_at?: string
          created_date?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          device_id?: string | null
          session_id?: string | null
          activity_type?: Database["public"]["Enums"]["activity_type"]
          activity_category?: string
          entity_id?: string | null
          entity_type?: string | null
          metadata?: Json | null
          url?: string | null
          referrer?: string | null
          time_spent_seconds?: number | null
          created_at?: string
          created_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      daily_active_users: {
        Row: {
          date: string | null
          unique_users: number | null
          total_sessions: number | null
          activity_category: string | null
          activity_type: string | null
        }
        Relationships: []
      }
      online_users: {
        Row: {
          user_id: string | null
          device_id: string | null
          session_id: string | null
          status: string | null
          last_seen_at: string | null
          current_activity: string | null
          display_name: string | null
          avatar_url: string | null
          user_type: string | null
          is_pwa_installed: boolean | null
        }
        Relationships: []
      }
      user_engagement_summary: {
        Row: {
          user_id: string | null
          total_activities: number | null
          active_days: number | null
          first_activity: string | null
          last_activity: string | null
          activities_last_7_days: number | null
          activities_last_30_days: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_follower_count: { Args: { target_user_id: string }; Returns: number }
      get_follower_ids: { Args: { target_user_id: string }; Returns: string[] }
      get_following_count: { Args: { target_user_id: string }; Returns: number }
      get_following_ids: { Args: { target_user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_view_count: {
        Args: { article_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "verified_writer" | "admin"
      article_status: "pending" | "published" | "rejected"
      activity_type: 
        | "app_open" | "app_install" | "app_update" | "login" | "logout" | "register"
        | "article_view" | "article_read" | "article_write" | "article_publish" 
        | "article_edit" | "article_delete" | "article_share" | "article_bookmark" 
        | "article_unbookmark" | "article_like" | "article_unlike"
        | "comment_add" | "comment_edit" | "comment_delete" | "comment_like"
        | "reaction_add" | "reaction_remove" | "follow_user" | "unfollow_user"
        | "profile_view" | "profile_edit" | "profile_setup"
        | "search" | "explore_view" | "notification_open" | "notification_read"
        | "vip_post_view" | "admin_action"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "verified_writer", "admin"],
      article_status: ["pending", "published", "rejected"],
      activity_type: [
        "app_open", "app_install", "app_update", "login", "logout", "register",
        "article_view", "article_read", "article_write", "article_publish", 
        "article_edit", "article_delete", "article_share", "article_bookmark", 
        "article_unbookmark", "article_like", "article_unlike",
        "comment_add", "comment_edit", "comment_delete", "comment_like",
        "reaction_add", "reaction_remove", "follow_user", "unfollow_user",
        "profile_view", "profile_edit", "profile_setup",
        "search", "explore_view", "notification_open", "notification_read",
        "vip_post_view", "admin_action"
      ],
    },
  },
} as const
