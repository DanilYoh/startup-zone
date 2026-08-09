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
      application_status_audit: {
        Row: {
          actor_id: string | null
          application_id: number | null
          changed_at: string
          id: number
          new_status: string
          previous_status: string
          startup_id: number
        }
        Insert: {
          actor_id?: string | null
          application_id?: number | null
          changed_at?: string
          id?: number
          new_status: string
          previous_status: string
          startup_id: number
        }
        Update: {
          actor_id?: string | null
          application_id?: number | null
          changed_at?: string
          id?: number
          new_status?: string
          previous_status?: string
          startup_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "application_status_audit_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string
          created_at: string
          id: number
          message: string
          startup_id: number
          status: Database["public"]["Enums"]["application_status"]
          type: Database["public"]["Enums"]["application_type"]
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: number
          message: string
          startup_id: number
          status?: Database["public"]["Enums"]["application_status"]
          type: Database["public"]["Enums"]["application_type"]
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: number
          message?: string
          startup_id?: number
          status?: Database["public"]["Enums"]["application_status"]
          type?: Database["public"]["Enums"]["application_type"]
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "public_founder_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          founder_experience: string | null
          full_name: string | null
          headline: string | null
          id: string
          investment_thesis: string | null
          investor_organization: string | null
          linkedin_url: string | null
          location: string | null
          preferred_stages: Database["public"]["Enums"]["startup_stage"][]
          role: Database["public"]["Enums"]["user_role"]
          ticket_max: number | null
          ticket_min: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          founder_experience?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          investment_thesis?: string | null
          investor_organization?: string | null
          linkedin_url?: string | null
          location?: string | null
          preferred_stages?: Database["public"]["Enums"]["startup_stage"][]
          role: Database["public"]["Enums"]["user_role"]
          ticket_max?: number | null
          ticket_min?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          founder_experience?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          investment_thesis?: string | null
          investor_organization?: string | null
          linkedin_url?: string | null
          location?: string | null
          preferred_stages?: Database["public"]["Enums"]["startup_stage"][]
          role?: Database["public"]["Enums"]["user_role"]
          ticket_max?: number | null
          ticket_min?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      startups: {
        Row: {
          created_at: string
          deck_url: string | null
          description: string
          equity_offered: number | null
          founder_id: string
          funding_ask: number | null
          id: number
          is_active: boolean
          niche: string[]
          one_pager: string
          slug: string
          stage: Database["public"]["Enums"]["startup_stage"]
          title: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          deck_url?: string | null
          description: string
          equity_offered?: number | null
          founder_id: string
          funding_ask?: number | null
          id?: number
          is_active?: boolean
          niche: string[]
          one_pager: string
          slug: string
          stage: Database["public"]["Enums"]["startup_stage"]
          title: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          deck_url?: string | null
          description?: string
          equity_offered?: number | null
          founder_id?: string
          funding_ask?: number | null
          id?: number
          is_active?: boolean
          niche?: string[]
          one_pager?: string
          slug?: string
          stage?: Database["public"]["Enums"]["startup_stage"]
          title?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startups_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startups_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "public_founder_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_founder_profiles: {
        Row: {
          founder_experience: string | null
          full_name: string | null
          headline: string | null
          id: string | null
          location: string | null
        }
        Insert: {
          founder_experience?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string | null
          location?: string | null
        }
        Update: {
          founder_experience?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string | null
          location?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_read_profile: {
        Args: { target_profile_id: string }
        Returns: boolean
      }
      valid_startup_niches: { Args: { value: string[] }; Returns: boolean }
    }
    Enums: {
      application_status: "pending" | "accepted" | "rejected"
      application_type: "team" | "investor"
      startup_stage: "idea" | "mvp" | "pre_seed" | "seed" | "series_a" | "later"
      user_role: "founder" | "specialist" | "investor"
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
      application_status: ["pending", "accepted", "rejected"],
      application_type: ["team", "investor"],
      startup_stage: ["idea", "mvp", "pre_seed", "seed", "series_a", "later"],
      user_role: ["founder", "specialist", "investor"],
    },
  },
} as const
