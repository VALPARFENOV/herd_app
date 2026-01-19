export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TenantTier = 'starter' | 'professional' | 'enterprise'
export type UserRole = 'owner' | 'manager' | 'veterinarian' | 'zootechnician' | 'accountant' | 'worker' | 'viewer'
export type AnimalSex = 'male' | 'female'
export type AnimalStatus = 'heifer' | 'lactating' | 'dry' | 'fresh' | 'sold' | 'dead' | 'culled'
export type AnimalOrigin = 'homebred' | 'purchased'
export type BarnType = 'milking' | 'dry' | 'calving' | 'heifer' | 'hospital'
export type PenType = 'lactating' | 'dry' | 'fresh' | 'hospital' | 'breeding'
export type EventType = 'breeding' | 'calving' | 'heat' | 'pregnancy_check' | 'dry_off' | 'treatment' | 'vaccination' | 'bcs' | 'sold' | 'culled' | 'dead'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          tier: TenantTier
          settings: Json
          limits: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          tier?: TenantTier
          settings?: Json
          limits?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          tier?: TenantTier
          settings?: Json
          limits?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string
          full_name: string | null
          role: UserRole
          permissions: Json
          avatar_url: string | null
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          full_name?: string | null
          role?: UserRole
          permissions?: Json
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          full_name?: string | null
          role?: UserRole
          permissions?: Json
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      barns: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          capacity: number | null
          barn_type: BarnType | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          capacity?: number | null
          barn_type?: BarnType | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          capacity?: number | null
          barn_type?: BarnType | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pens: {
        Row: {
          id: string
          tenant_id: string
          barn_id: string | null
          name: string
          capacity: number | null
          pen_type: PenType | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          barn_id?: string | null
          name: string
          capacity?: number | null
          pen_type?: PenType | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          barn_id?: string | null
          name?: string
          capacity?: number | null
          pen_type?: PenType | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      animals: {
        Row: {
          id: string
          tenant_id: string
          ear_tag: string
          registration_number: string | null
          electronic_id: string | null
          name: string | null
          birth_date: string
          breed: string
          sex: AnimalSex
          color: string | null
          origin: AnimalOrigin
          entry_date: string | null
          sire_id: string | null
          dam_id: string | null
          sire_registration: string | null
          dam_registration: string | null
          pen_id: string | null
          current_status: AnimalStatus
          lactation_number: number
          last_calving_date: string | null
          reproductive_status: string | null
          last_heat_date: string | null
          last_breeding_date: string | null
          pregnancy_confirmed_date: string | null
          expected_calving_date: string | null
          days_carried: number | null
          last_test_date: string | null
          last_milk_kg: number | null
          last_fat_percent: number | null
          last_protein_percent: number | null
          last_scc: number | null
          bcs_score: number | null
          last_vet_check_date: string | null
          notes: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          sync_version: number
        }
        Insert: {
          id?: string
          tenant_id: string
          ear_tag: string
          registration_number?: string | null
          electronic_id?: string | null
          name?: string | null
          birth_date: string
          breed: string
          sex?: AnimalSex
          color?: string | null
          origin?: AnimalOrigin
          entry_date?: string | null
          sire_id?: string | null
          dam_id?: string | null
          sire_registration?: string | null
          dam_registration?: string | null
          pen_id?: string | null
          current_status?: AnimalStatus
          lactation_number?: number
          last_calving_date?: string | null
          reproductive_status?: string | null
          last_heat_date?: string | null
          last_breeding_date?: string | null
          pregnancy_confirmed_date?: string | null
          expected_calving_date?: string | null
          last_test_date?: string | null
          last_milk_kg?: number | null
          last_fat_percent?: number | null
          last_protein_percent?: number | null
          last_scc?: number | null
          bcs_score?: number | null
          last_vet_check_date?: string | null
          notes?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          sync_version?: number
        }
        Update: {
          id?: string
          tenant_id?: string
          ear_tag?: string
          registration_number?: string | null
          electronic_id?: string | null
          name?: string | null
          birth_date?: string
          breed?: string
          sex?: AnimalSex
          color?: string | null
          origin?: AnimalOrigin
          entry_date?: string | null
          sire_id?: string | null
          dam_id?: string | null
          sire_registration?: string | null
          dam_registration?: string | null
          pen_id?: string | null
          current_status?: AnimalStatus
          lactation_number?: number
          last_calving_date?: string | null
          reproductive_status?: string | null
          last_heat_date?: string | null
          last_breeding_date?: string | null
          pregnancy_confirmed_date?: string | null
          expected_calving_date?: string | null
          last_test_date?: string | null
          last_milk_kg?: number | null
          last_fat_percent?: number | null
          last_protein_percent?: number | null
          last_scc?: number | null
          bcs_score?: number | null
          last_vet_check_date?: string | null
          notes?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          sync_version?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          event_type: string
          event_date: string
          event_time: string | null
          details: Json
          created_by: string | null
          created_at: string
          updated_at: string
          sync_version: number
        }
        Insert: {
          id?: string
          tenant_id: string
          animal_id: string
          event_type: string
          event_date: string
          event_time?: string | null
          details?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          sync_version?: number
        }
        Update: {
          id?: string
          tenant_id?: string
          animal_id?: string
          event_type?: string
          event_date?: string
          event_time?: string | null
          details?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          sync_version?: number
        }
        Relationships: []
      }
      lactations: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          lactation_number: number
          calving_date: string
          dry_date: string | null
          days_in_milk: number | null
          total_milk_kg: number | null
          me_305_milk: number | null
          me_305_fat: number | null
          me_305_protein: number | null
          peak_milk_kg: number | null
          peak_dim: number | null
          avg_fat_percent: number | null
          avg_protein_percent: number | null
          avg_scc: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          animal_id: string
          lactation_number: number
          calving_date: string
          dry_date?: string | null
          days_in_milk?: number | null
          total_milk_kg?: number | null
          me_305_milk?: number | null
          me_305_fat?: number | null
          me_305_protein?: number | null
          peak_milk_kg?: number | null
          peak_dim?: number | null
          avg_fat_percent?: number | null
          avg_protein_percent?: number | null
          avg_scc?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          animal_id?: string
          lactation_number?: number
          calving_date?: string
          dry_date?: string | null
          days_in_milk?: number | null
          total_milk_kg?: number | null
          me_305_milk?: number | null
          me_305_fat?: number | null
          me_305_protein?: number | null
          peak_milk_kg?: number | null
          peak_dim?: number | null
          avg_fat_percent?: number | null
          avg_protein_percent?: number | null
          avg_scc?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tenant_tier: TenantTier
      user_role: UserRole
      animal_sex: AnimalSex
      animal_status: AnimalStatus
      animal_origin: AnimalOrigin
      barn_type: BarnType
      pen_type: PenType
      event_type: EventType
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience type aliases
export type Tenant = Tables<'tenants'>
export type Profile = Tables<'profiles'>
export type Barn = Tables<'barns'>
export type Pen = Tables<'pens'>
export type Animal = Tables<'animals'>
export type Event = Tables<'events'>
export type Lactation = Tables<'lactations'>
