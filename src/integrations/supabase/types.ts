export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      publisher_books: {
        Row: {
          author: string
          cover_url: string | null
          created_at: string
          editorial_note: string | null
          id: string
          isbn: string | null
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
          death_year: number | null
          id: string
          name: string
          nationality: string | null
          notable_works: string[] | null
          updated_at: string
          wikipedia_url: string | null
        }
        Insert: {
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          death_year?: number | null
          id?: string
          name: string
          nationality?: string | null
          notable_works?: string[] | null
          updated_at?: string
          wikipedia_url?: string | null
        }
        Update: {
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          death_year?: number | null
          id?: string
          name?: string
          nationality?: string | null
          notable_works?: string[] | null
          updated_at?: string
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
          id: number
          isbn: string | null
          notes: string | null
          open_count: number | null
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
          id?: number
          isbn?: string | null
          notes?: string | null
          open_count?: number | null
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
          id?: number
          isbn?: string | null
          notes?: string | null
          open_count?: number | null
          publisher_series_id?: string | null
          resonance_labels?: string | null
          tags?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transmissions_publisher_series_id_fkey"
            columns: ["publisher_series_id"]
            isOneToOne: false
            referencedRelation: "publisher_series"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
