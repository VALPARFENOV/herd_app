/**
 * Supabase Database Types
 * Auto-generated placeholder for RPC functions
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, any>
      }
    }
    Functions: {
      get_unread_notification_count: {
        Args: {
          p_tenant_id: string
        }
        Returns: number
      }
      mark_notification_read: {
        Args: {
          p_notification_id: string
        }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: {
          p_tenant_id: string
        }
        Returns: number
      }
      generate_daily_alerts: {
        Args: {
          p_tenant_id: string
        }
        Returns: Json
      }
      generate_calving_due_alerts: {
        Args: {
          p_tenant_id: string
          p_days_threshold?: number
        }
        Returns: number
      }
      generate_preg_check_overdue_alerts: {
        Args: {
          p_tenant_id: string
          p_days_threshold?: number
        }
        Returns: number
      }
      generate_high_scc_alerts: {
        Args: {
          p_tenant_id: string
          p_threshold?: number
        }
        Returns: number
      }
      deduct_semen_straw: {
        Args: {
          p_bull_id: string
          p_tenant_id: string
          p_straws?: number
        }
        Returns: boolean
      }
      calculate_ecm: {
        Args: {
          p_milk_kg: number
          p_fat_percent: number
          p_protein_percent: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
