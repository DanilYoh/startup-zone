export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "founder" | "specialist" | "investor";
export type StartupStage = "idea" | "mvp" | "pre_seed" | "seed" | "series_a" | "later";
export type ApplicationType = "team" | "investor";
export type ApplicationStatus = "pending" | "accepted" | "rejected";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          linkedin_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          linkedin_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      startups: {
        Row: {
          id: number;
          founder_id: string;
          title: string;
          slug: string;
          one_pager: string;
          description: string;
          stage: StartupStage;
          niche: string[];
          funding_ask: number | null;
          equity_offered: number | null;
          deck_url: string | null;
          website_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          founder_id: string;
          title: string;
          slug: string;
          one_pager: string;
          description: string;
          stage: StartupStage;
          niche?: string[];
          funding_ask?: number | null;
          equity_offered?: number | null;
          deck_url?: string | null;
          website_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["startups"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "startups_founder_id_fkey";
            columns: ["founder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          id: number;
          startup_id: number;
          applicant_id: string;
          type: ApplicationType;
          message: string | null;
          status: ApplicationStatus;
          created_at: string;
        };
        Insert: {
          id?: number;
          startup_id: number;
          applicant_id: string;
          type: ApplicationType;
          message?: string | null;
          status?: ApplicationStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_startup_id_fkey";
            columns: ["startup_id"];
            isOneToOne: false;
            referencedRelation: "startups";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { user_role: UserRole };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
