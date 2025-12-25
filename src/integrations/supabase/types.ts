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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      author_ai_analysis: {
        Row: {
          analysis_data: Json
          author_identifier: string
          cached_at: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          analysis_data: Json
          author_identifier: string
          cached_at?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          analysis_data?: Json
          author_identifier?: string
          cached_at?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      author_books: {
        Row: {
          author_id: string | null
          categories: string[] | null
          conceptual_tags: string[] | null
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
          conceptual_tags?: string[] | null
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
          conceptual_tags?: string[] | null
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
      book_ai_analysis: {
        Row: {
          analysis_data: Json
          book_identifier: string
          cached_at: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          analysis_data: Json
          book_identifier: string
          cached_at?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          analysis_data?: Json
          book_identifier?: string
          cached_at?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      book_ai_tags: {
        Row: {
          book_identifier: string
          cached_at: string | null
          created_at: string | null
          id: string
          suggested_tags: Json
          user_id: string | null
        }
        Insert: {
          book_identifier: string
          cached_at?: string | null
          created_at?: string | null
          id?: string
          suggested_tags: Json
          user_id?: string | null
        }
        Update: {
          book_identifier?: string
          cached_at?: string | null
          created_at?: string | null
          id?: string
          suggested_tags?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      book_collections: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      book_embeddings: {
        Row: {
          author: string
          book_identifier: string
          created_at: string | null
          embedding: string | null
          embedding_text: string | null
          id: string
          metadata: Json | null
          model_version: string | null
          source_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author: string
          book_identifier: string
          created_at?: string | null
          embedding?: string | null
          embedding_text?: string | null
          id?: string
          metadata?: Json | null
          model_version?: string | null
          source_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          book_identifier?: string
          created_at?: string | null
          embedding?: string | null
          embedding_text?: string | null
          id?: string
          metadata?: Json | null
          model_version?: string | null
          source_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
      book_recommendations_cache: {
        Row: {
          cached_at: string | null
          created_at: string | null
          id: string
          recommendations: Json
          user_id: string
        }
        Insert: {
          cached_at?: string | null
          created_at?: string | null
          id?: string
          recommendations: Json
          user_id: string
        }
        Update: {
          cached_at?: string | null
          created_at?: string | null
          id?: string
          recommendations?: Json
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          highlights: Json | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          highlights?: Json | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          highlights?: Json | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_books: {
        Row: {
          added_at: string | null
          book_author: string
          book_isbn: string | null
          book_title: string
          collection_id: string
          cover_url: string | null
          id: string
          personal_notes: string | null
        }
        Insert: {
          added_at?: string | null
          book_author: string
          book_isbn?: string | null
          book_title: string
          collection_id: string
          cover_url?: string | null
          id?: string
          personal_notes?: string | null
        }
        Update: {
          added_at?: string | null
          book_author?: string
          book_isbn?: string | null
          book_title?: string
          collection_id?: string
          cover_url?: string | null
          id?: string
          personal_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_books_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "book_collections"
            referencedColumns: ["id"]
          },
        ]
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
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          preferences: Json | null
          status: string
          subscribed_at: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          preferences?: Json | null
          status?: string
          subscribed_at?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          preferences?: Json | null
          status?: string
          subscribed_at?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          from_user_id: string | null
          id: string
          is_read: boolean | null
          transmission_id: number | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          is_read?: boolean | null
          transmission_id?: number | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          is_read?: boolean | null
          transmission_id?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_transmission_id_fkey"
            columns: ["transmission_id"]
            isOneToOne: false
            referencedRelation: "transmissions"
            referencedColumns: ["id"]
          },
        ]
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
      reading_challenges: {
        Row: {
          ai_encouragement: string | null
          challenge_type: string
          completed_at: string | null
          created_at: string
          current_progress: number
          description: string
          difficulty: string
          expires_at: string | null
          goal_count: number
          id: string
          metadata: Json | null
          status: string
          target_books: Json | null
          title: string
          user_id: string
        }
        Insert: {
          ai_encouragement?: string | null
          challenge_type: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          description: string
          difficulty?: string
          expires_at?: string | null
          goal_count?: number
          id?: string
          metadata?: Json | null
          status?: string
          target_books?: Json | null
          title: string
          user_id: string
        }
        Update: {
          ai_encouragement?: string | null
          challenge_type?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          description?: string
          difficulty?: string
          expires_at?: string | null
          goal_count?: number
          id?: string
          metadata?: Json | null
          status?: string
          target_books?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_insights: {
        Row: {
          created_at: string | null
          generated_at: string | null
          id: string
          metadata: Json | null
          narrative: string
          timeframe: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          metadata?: Json | null
          narrative: string
          timeframe?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          metadata?: Json | null
          narrative?: string
          timeframe?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          book_author: string
          book_title: string
          created_at: string | null
          id: string
          mood_rating: number | null
          notes: string | null
          pages_read: number | null
          session_end: string | null
          session_start: string | null
          user_id: string
        }
        Insert: {
          book_author: string
          book_title: string
          created_at?: string | null
          id?: string
          mood_rating?: number | null
          notes?: string | null
          pages_read?: number | null
          session_end?: string | null
          session_start?: string | null
          user_id: string
        }
        Update: {
          book_author?: string
          book_title?: string
          created_at?: string | null
          id?: string
          mood_rating?: number | null
          notes?: string | null
          pages_read?: number | null
          session_end?: string | null
          session_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      search_queries: {
        Row: {
          clicked_book_identifier: string | null
          created_at: string | null
          filters_applied: Json | null
          id: string
          query_embedding: string | null
          query_text: string
          response_time_ms: number | null
          result_count: number | null
          search_type: string | null
          user_id: string | null
          was_helpful: boolean | null
        }
        Insert: {
          clicked_book_identifier?: string | null
          created_at?: string | null
          filters_applied?: Json | null
          id?: string
          query_embedding?: string | null
          query_text: string
          response_time_ms?: number | null
          result_count?: number | null
          search_type?: string | null
          user_id?: string | null
          was_helpful?: boolean | null
        }
        Update: {
          clicked_book_identifier?: string | null
          created_at?: string | null
          filters_applied?: Json | null
          id?: string
          query_embedding?: string | null
          query_text?: string
          response_time_ms?: number | null
          result_count?: number | null
          search_type?: string | null
          user_id?: string | null
          was_helpful?: boolean | null
        }
        Relationships: []
      }
      temporal_analysis_cache: {
        Row: {
          analysis: Json
          created_at: string
          generated_at: string
          id: string
          temporal_signature: string
          user_id: string
        }
        Insert: {
          analysis: Json
          created_at?: string
          generated_at?: string
          id?: string
          temporal_signature: string
          user_id: string
        }
        Update: {
          analysis?: Json
          created_at?: string
          generated_at?: string
          id?: string
          temporal_signature?: string
          user_id?: string
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
          is_favorite: boolean | null
          isbn: string | null
          last_analytics_update: string | null
          narrative_time_period: string | null
          notes: string | null
          open_count: number | null
          profile_id: string | null
          publication_year: number | null
          publisher_series_id: string | null
          reading_velocity_score: number | null
          resonance_labels: string | null
          tags: string | null
          temporal_context_tags: string[] | null
          thematic_constellation: string | null
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
          is_favorite?: boolean | null
          isbn?: string | null
          last_analytics_update?: string | null
          narrative_time_period?: string | null
          notes?: string | null
          open_count?: number | null
          profile_id?: string | null
          publication_year?: number | null
          publisher_series_id?: string | null
          reading_velocity_score?: number | null
          resonance_labels?: string | null
          tags?: string | null
          temporal_context_tags?: string[] | null
          thematic_constellation?: string | null
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
          is_favorite?: boolean | null
          isbn?: string | null
          last_analytics_update?: string | null
          narrative_time_period?: string | null
          notes?: string | null
          open_count?: number | null
          profile_id?: string | null
          publication_year?: number | null
          publisher_series_id?: string | null
          reading_velocity_score?: number | null
          resonance_labels?: string | null
          tags?: string | null
          temporal_context_tags?: string[] | null
          thematic_constellation?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transmissions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_reading_patterns: {
        Row: {
          confidence: number
          description: string | null
          detected_at: string | null
          evidence: Json | null
          id: string
          pattern_type: string
          user_id: string
        }
        Insert: {
          confidence: number
          description?: string | null
          detected_at?: string | null
          evidence?: Json | null
          id?: string
          pattern_type: string
          user_id: string
        }
        Update: {
          confidence?: number
          description?: string | null
          detected_at?: string | null
          evidence?: Json | null
          id?: string
          pattern_type?: string
          user_id?: string
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
      reading_analytics: {
        Row: {
          avg_publication_year: number | null
          books_per_day: number | null
          first_transmission: string | null
          latest_transmission: string | null
          reading_span_days: number | null
          total_books: number | null
          unique_authors: number | null
          unique_tags: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_or_create_scifi_author: {
        Args: { author_name: string }
        Returns: string
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_reading_analytics: {
        Args: never
        Returns: {
          avg_publication_year: number
          books_per_day: number
          first_transmission: string
          latest_transmission: string
          reading_span_days: number
          total_books: number
          unique_authors: number
          unique_tags: number
          user_id: string
        }[]
      }
      get_user_stats: {
        Args: { user_ids: string[] }
        Returns: {
          follower_count: number
          transmission_count: number
          user_id: string
        }[]
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
      refresh_reading_analytics: { Args: never; Returns: undefined }
      semantic_search: {
        Args: {
          filter_source?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          author: string
          book_identifier: string
          id: string
          metadata: Json
          similarity: number
          source_type: string
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
