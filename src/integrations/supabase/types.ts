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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      author_books: {
        Row: {
          author_id: string | null
          categories: string[] | null
          cover_url: string | null
          created_at: string
          description: string | null
          google_books_id: string | null
          id: string
          info_link: string | null
          page_count: number | null
          preview_link: string | null
          published_date: string | null
          rating: number | null
          ratings_count: number | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          categories?: string[] | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          google_books_id?: string | null
          id?: string
          info_link?: string | null
          page_count?: number | null
          preview_link?: string | null
          published_date?: string | null
          rating?: number | null
          ratings_count?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          categories?: string[] | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          google_books_id?: string | null
          id?: string
          info_link?: string | null
          page_count?: number | null
          preview_link?: string | null
          published_date?: string | null
          rating?: number | null
          ratings_count?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "scifi_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      author_data_sources: {
        Row: {
          author_id: string | null
          confidence_score: number | null
          created_at: string
          data_retrieved: Json | null
          id: string
          last_validated: string | null
          source_type: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          confidence_score?: number | null
          created_at?: string
          data_retrieved?: Json | null
          id?: string
          last_validated?: string | null
          source_type: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          confidence_score?: number | null
          created_at?: string
          data_retrieved?: Json | null
          id?: string
          last_validated?: string | null
          source_type?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_data_sources_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "scifi_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      author_enrichment_queue: {
        Row: {
          attempts: number | null
          author_id: string | null
          created_at: string
          enrichment_type: string
          error_message: string | null
          id: string
          priority: number | null
          processed_at: string | null
          scheduled_for: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          author_id?: string | null
          created_at?: string
          enrichment_type: string
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          scheduled_for?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          author_id?: string | null
          created_at?: string
          enrichment_type?: string
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          scheduled_for?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "author_enrichment_queue_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "scifi_authors"
            referencedColumns: ["id"]
          },
        ]
      }
      book_interactions: {
        Row: {
          book_author: string
          book_isbn: string | null
          book_title: string
          browser_type: string | null
          created_at: string | null
          device_type: string | null
          digital_source: string | null
          error_details: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          response_time_ms: number | null
          search_query: string | null
          source_context: string | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          book_author: string
          book_isbn?: string | null
          book_title: string
          browser_type?: string | null
          created_at?: string | null
          device_type?: string | null
          digital_source?: string | null
          error_details?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          response_time_ms?: number | null
          search_query?: string | null
          source_context?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          book_author?: string
          book_isbn?: string | null
          book_title?: string
          browser_type?: string | null
          created_at?: string | null
          device_type?: string | null
          digital_source?: string | null
          error_details?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          response_time_ms?: number | null
          search_query?: string | null
          source_context?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      ebook_search_cache: {
        Row: {
          annas_archive_results: Json | null
          author: string
          created_at: string
          gutenberg_results: Json | null
          id: string
          internet_archive_results: Json | null
          last_searched: string
          search_key: string
          title: string
          updated_at: string
        }
        Insert: {
          annas_archive_results?: Json | null
          author: string
          created_at?: string
          gutenberg_results?: Json | null
          id?: string
          internet_archive_results?: Json | null
          last_searched?: string
          search_key: string
          title: string
          updated_at?: string
        }
        Update: {
          annas_archive_results?: Json | null
          author?: string
          created_at?: string
          gutenberg_results?: Json | null
          id?: string
          internet_archive_results?: Json | null
          last_searched?: string
          search_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      free_ebook_links: {
        Row: {
          archive_id: string | null
          archive_url: string | null
          book_author: string
          book_title: string
          created_at: string
          formats: Json | null
          gutenberg_id: string | null
          gutenberg_url: string | null
          id: string
          isbn: string | null
          last_checked: string
          updated_at: string
        }
        Insert: {
          archive_id?: string | null
          archive_url?: string | null
          book_author: string
          book_title: string
          created_at?: string
          formats?: Json | null
          gutenberg_id?: string | null
          gutenberg_url?: string | null
          id?: string
          isbn?: string | null
          last_checked?: string
          updated_at?: string
        }
        Update: {
          archive_id?: string | null
          archive_url?: string | null
          book_author?: string
          book_title?: string
          created_at?: string
          formats?: Json | null
          gutenberg_id?: string | null
          gutenberg_url?: string | null
          id?: string
          isbn?: string | null
          last_checked?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          context: string | null
          device_type: string | null
          id: string
          metric_type: string
          metric_value: number
          network_type: string | null
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          context?: string | null
          device_type?: string | null
          id?: string
          metric_type: string
          metric_value: number
          network_type?: string | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          context?: string | null
          device_type?: string | null
          id?: string
          metric_type?: string
          metric_value?: number
          network_type?: string | null
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string
          first_name: string | null
          id: string
          language: string | null
          last_active: string | null
          last_name: string | null
          notification_settings: Json | null
          reading_preferences: Json | null
          theme_preference: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          first_name?: string | null
          id: string
          language?: string | null
          last_active?: string | null
          last_name?: string | null
          notification_settings?: Json | null
          reading_preferences?: Json | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          first_name?: string | null
          id?: string
          language?: string | null
          last_active?: string | null
          last_name?: string | null
          notification_settings?: Json | null
          reading_preferences?: Json | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      publisher_books: {
        Row: {
          author: string
          cover_url: string | null
          created_at: string
          editorial_note: string | null
          id: string
          isbn: string | null
          penguin_url: string | null
          publication_year: number | null
          series_id: string
          title: string
        }
        Insert: {
          author: string
          cover_url?: string | null
          created_at?: string
          editorial_note?: string | null
          id?: string
          isbn?: string | null
          penguin_url?: string | null
          publication_year?: number | null
          series_id: string
          title: string
        }
        Update: {
          author?: string
          cover_url?: string | null
          created_at?: string
          editorial_note?: string | null
          id?: string
          isbn?: string | null
          penguin_url?: string | null
          publication_year?: number | null
          series_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "publisher_books_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "publisher_series"
            referencedColumns: ["id"]
          },
        ]
      }
      publisher_series: {
        Row: {
          badge_emoji: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          publisher: string
        }
        Insert: {
          badge_emoji?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          publisher: string
        }
        Update: {
          badge_emoji?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          publisher?: string
        }
        Relationships: []
      }
      scifi_authors: {
        Row: {
          bio: string | null
          birth_year: number | null
          created_at: string
          data_quality_score: number | null
          data_source: string | null
          death_year: number | null
          enrichment_attempts: number | null
          id: string
          last_enriched: string | null
          name: string
          nationality: string | null
          needs_enrichment: boolean | null
          notable_works: string[] | null
          updated_at: string
          verification_status: string | null
          wikipedia_url: string | null
        }
        Insert: {
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          data_quality_score?: number | null
          data_source?: string | null
          death_year?: number | null
          enrichment_attempts?: number | null
          id?: string
          last_enriched?: string | null
          name: string
          nationality?: string | null
          needs_enrichment?: boolean | null
          notable_works?: string[] | null
          updated_at?: string
          verification_status?: string | null
          wikipedia_url?: string | null
        }
        Update: {
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          data_quality_score?: number | null
          data_source?: string | null
          death_year?: number | null
          enrichment_attempts?: number | null
          id?: string
          last_enriched?: string | null
          name?: string
          nationality?: string | null
          needs_enrichment?: boolean | null
          notable_works?: string[] | null
          updated_at?: string
          verification_status?: string | null
          wikipedia_url?: string | null
        }
        Relationships: []
      }
      transmissions: {
        Row: {
          apple_link: string | null
          author: string | null
          cover_url: string | null
          created_at: string
          historical_context_tags: string[] | null
          id: number
          isbn: string | null
          narrative_time_period: string | null
          notes: string | null
          open_count: number | null
          publication_year: number | null
          publisher_series_id: string | null
          resonance_labels: string | null
          tags: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          apple_link?: string | null
          author?: string | null
          cover_url?: string | null
          created_at?: string
          historical_context_tags?: string[] | null
          id?: number
          isbn?: string | null
          narrative_time_period?: string | null
          notes?: string | null
          open_count?: number | null
          publication_year?: number | null
          publisher_series_id?: string | null
          resonance_labels?: string | null
          tags?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          apple_link?: string | null
          author?: string | null
          cover_url?: string | null
          created_at?: string
          historical_context_tags?: string[] | null
          id?: number
          isbn?: string | null
          narrative_time_period?: string | null
          notes?: string | null
          open_count?: number | null
          publication_year?: number | null
          publisher_series_id?: string | null
          resonance_labels?: string | null
          tags?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_or_create_scifi_author: {
        Args: { author_name: string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_book_interaction: {
        Args: {
          p_book_author: string
          p_book_isbn?: string
          p_book_title: string
          p_browser_type?: string
          p_device_type?: string
          p_digital_source?: string
          p_error_details?: string
          p_interaction_type?: string
          p_metadata?: Json
          p_response_time_ms?: number
          p_search_query?: string
          p_source_context?: string
          p_success?: boolean
          p_user_id: string
        }
        Returns: string
      }
      log_performance_metric: {
        Args: {
          p_context?: string
          p_device_type?: string
          p_metric_type: string
          p_metric_value: number
          p_network_type?: string
          p_user_agent?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "premium"
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
      app_role: ["admin", "moderator", "user", "premium"],
    },
  },
} as const
