import type { Enums } from "@/lib/supabase/types";

export type UserRole = Enums<"user_role">;
export type MarketplaceRole = "founder" | "investor";
export type StartupStage = Enums<"startup_stage">;
export type ApplicationStatus = Enums<"application_status">;
