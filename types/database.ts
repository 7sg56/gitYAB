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
            users: {
                Row: {
                    id: string
                    auth_id: string
                    github_username: string
                    encrypted_pat: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    auth_id: string
                    github_username: string
                    encrypted_pat: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    auth_id?: string
                    github_username?: string
                    encrypted_pat?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            user_settings: {
                Row: {
                    id: string
                    user_id: string
                    auto_rescan_enabled: boolean
                    auto_rescan_interval_ms: number
                    last_scan: string | null
                    right_panel_open: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    auto_rescan_enabled?: boolean
                    auto_rescan_interval_ms?: number
                    last_scan?: string | null
                    right_panel_open?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    auto_rescan_enabled?: boolean
                    auto_rescan_interval_ms?: number
                    last_scan?: string | null
                    right_panel_open?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            rivals: {
                Row: {
                    id: string
                    user_id: string
                    rival_username: string
                    enabled: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    rival_username: string
                    enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    rival_username?: string
                    enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            github_stats_cache: {
                Row: {
                    id: string
                    username: string
                    data: Json
                    expires_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    username: string
                    data: Json
                    expires_at: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    data?: Json
                    expires_at?: string
                    created_at?: string
                }
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
    }
}

// For now, use a simpler type that works with Supabase
export type SupabaseTables = Database['public']['Tables'];
