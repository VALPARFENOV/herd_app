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
        Relationships: [
          {
            foreignKeyName: "pens_barn_id_fkey"
            columns: ["barn_id"]
            isOneToOne: false
            referencedRelation: "barns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
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
          rc_code: number | null
          last_body_condition_score: number | null
          permanent_note: string | null
          enrollment_date: string | null
          dry_date: string | null
          conception_date: string | null
          last_breeding_bull_id: string | null
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
          rc_code?: number | null
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
          rc_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_pen_id_fkey"
            columns: ["pen_id"]
            isOneToOne: false
            referencedRelation: "pens"
            referencedColumns: ["id"]
          }
        ]
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
      notifications: {
        Row: {
          id: string
          tenant_id: string
          alert_type: string
          title: string
          message: string
          severity: string
          animal_id: string | null
          related_entity_type: string | null
          related_entity_id: string | null
          action_url: string | null
          is_read: boolean
          read_at: string | null
          is_dismissed: boolean
          dismissed_at: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          alert_type: string
          title: string
          message: string
          severity?: string
          animal_id?: string | null
          related_entity_type?: string | null
          related_entity_id?: string | null
          action_url?: string | null
          is_read?: boolean
          read_at?: string | null
          is_dismissed?: boolean
          dismissed_at?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          alert_type?: string
          title?: string
          message?: string
          severity?: string
          animal_id?: string | null
          related_entity_type?: string | null
          related_entity_id?: string | null
          action_url?: string | null
          is_read?: boolean
          read_at?: string | null
          is_dismissed?: boolean
          dismissed_at?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      milk_tests: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          test_date: string
          test_number: number | null
          lactation_number: number | null
          dim: number | null
          milk_kg: number | null
          milk_am: number | null
          milk_pm: number | null
          fat_percent: number | null
          fat_kg: number | null
          protein_percent: number | null
          protein_kg: number | null
          lactose_percent: number | null
          solids_percent: number | null
          scc: number | null
          mun: number | null
          bhn: number | null
          fat_protein_ratio: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          animal_id: string
          test_date: string
          test_number?: number | null
          lactation_number?: number | null
          dim?: number | null
          milk_kg?: number | null
          milk_am?: number | null
          milk_pm?: number | null
          fat_percent?: number | null
          fat_kg?: number | null
          protein_percent?: number | null
          protein_kg?: number | null
          lactose_percent?: number | null
          solids_percent?: number | null
          scc?: number | null
          mun?: number | null
          bhn?: number | null
          fat_protein_ratio?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          animal_id?: string
          test_date?: string
          test_number?: number | null
          lactation_number?: number | null
          dim?: number | null
          milk_kg?: number | null
          milk_am?: number | null
          milk_pm?: number | null
          fat_percent?: number | null
          fat_kg?: number | null
          protein_percent?: number | null
          protein_kg?: number | null
          lactose_percent?: number | null
          solids_percent?: number | null
          scc?: number | null
          mun?: number | null
          bhn?: number | null
          fat_protein_ratio?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bulls: {
        Row: {
          id: string
          tenant_id: string
          name: string
          registration_number: string | null
          breed: string | null
          status: string
          semen_type: string | null
          genomic_data: Json | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          registration_number?: string | null
          breed?: string | null
          status?: string
          semen_type?: string | null
          genomic_data?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          registration_number?: string | null
          breed?: string | null
          status?: string
          semen_type?: string | null
          genomic_data?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      semen_inventory: {
        Row: {
          id: string
          tenant_id: string
          bull_id: string
          batch_number: string | null
          quantity: number
          straws_available: number
          straws_used: number
          storage_location: string | null
          received_date: string | null
          expiry_date: string | null
          cost_per_dose: number | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          bull_id: string
          batch_number?: string | null
          quantity?: number
          straws_available?: number
          straws_used?: number
          storage_location?: string | null
          received_date?: string | null
          expiry_date?: string | null
          cost_per_dose?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          bull_id?: string
          batch_number?: string | null
          quantity?: number
          straws_available?: number
          straws_used?: number
          storage_location?: string | null
          received_date?: string | null
          expiry_date?: string | null
          cost_per_dose?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      udder_quarter_tests: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          test_date: string
          test_type: string | null
          quarter: string
          cmt_score: number | null
          scc: number | null
          result_value: number | null
          result_text: string | null
          result_interpretation: string | null
          pathogen: string | null
          colony_count: string | null
          antibiotic_sensitivity: Json | null
          bacteria_type: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          animal_id: string
          test_date: string
          test_type?: string | null
          quarter: string
          cmt_score?: number | null
          scc?: number | null
          result_value?: number | null
          result_text?: string | null
          result_interpretation?: string | null
          pathogen?: string | null
          colony_count?: string | null
          antibiotic_sensitivity?: Json | null
          bacteria_type?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          animal_id?: string
          test_date?: string
          test_type?: string | null
          quarter?: string
          cmt_score?: number | null
          scc?: number | null
          result_value?: number | null
          result_text?: string | null
          result_interpretation?: string | null
          pathogen?: string | null
          colony_count?: string | null
          antibiotic_sensitivity?: Json | null
          bacteria_type?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      bulk_tank_readings: {
        Row: {
          id: string
          tenant_id: string
          reading_date: string
          volume_liters: number | null
          fat_percent: number | null
          protein_percent: number | null
          scc: number | null
          bacteria_count: number | null
          temperature: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          reading_date: string
          volume_liters?: number | null
          fat_percent?: number | null
          protein_percent?: number | null
          scc?: number | null
          bacteria_count?: number | null
          temperature?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          reading_date?: string
          volume_liters?: number | null
          fat_percent?: number | null
          protein_percent?: number | null
          scc?: number | null
          bacteria_count?: number | null
          temperature?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      hoof_inspections: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          inspection_date: string
          hoof: string
          condition: string | null
          treatment: string | null
          score: number | null
          notes: string | null
          inspector_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          animal_id: string
          inspection_date: string
          hoof: string
          condition?: string | null
          treatment?: string | null
          score?: number | null
          notes?: string | null
          inspector_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          animal_id?: string
          inspection_date?: string
          hoof?: string
          condition?: string | null
          treatment?: string | null
          score?: number | null
          notes?: string | null
          inspector_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      milk_readings: {
        Row: {
          id: string
          tenant_id: string
          animal_id: string
          reading_date: string
          session: string
          volume_kg: number | null
          duration_seconds: number | null
          flow_rate: number | null
          conductivity: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          animal_id: string
          reading_date: string
          session: string
          volume_kg?: number | null
          duration_seconds?: number | null
          flow_rate?: number | null
          conductivity?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          animal_id?: string
          reading_date?: string
          session?: string
          volume_kg?: number | null
          duration_seconds?: number | null
          flow_rate?: number | null
          conductivity?: number | null
          created_at?: string
        }
        Relationships: []
      }
      economic_settings: {
        Row: {
          tenant_id: string
          milk_price_per_kg: number
          fat_bonus_per_percent: number
          protein_bonus_per_percent: number
          scc_penalty_threshold: number
          scc_penalty_per_unit: number
          feed_cost_per_day: number
          bedding_cost_per_day: number
          labor_cost_per_cow_per_month: number
          vet_cost_per_treatment: number
          breeding_cost_per_service: number
          heifer_purchase_cost: number
          cull_cow_value: number
          calf_value_male: number
          calf_value_female: number
          depreciation_per_cow_per_year: number
          currency_code: string
          last_updated: string
          updated_by: string | null
        }
        Insert: {
          tenant_id: string
          milk_price_per_kg?: number
          fat_bonus_per_percent?: number
          protein_bonus_per_percent?: number
          scc_penalty_threshold?: number
          scc_penalty_per_unit?: number
          feed_cost_per_day?: number
          bedding_cost_per_day?: number
          labor_cost_per_cow_per_month?: number
          vet_cost_per_treatment?: number
          breeding_cost_per_service?: number
          heifer_purchase_cost?: number
          cull_cow_value?: number
          calf_value_male?: number
          calf_value_female?: number
          depreciation_per_cow_per_year?: number
          currency_code?: string
          last_updated?: string
          updated_by?: string | null
        }
        Update: {
          tenant_id?: string
          milk_price_per_kg?: number
          fat_bonus_per_percent?: number
          protein_bonus_per_percent?: number
          scc_penalty_threshold?: number
          scc_penalty_per_unit?: number
          feed_cost_per_day?: number
          bedding_cost_per_day?: number
          labor_cost_per_cow_per_month?: number
          vet_cost_per_treatment?: number
          breeding_cost_per_service?: number
          heifer_purchase_cost?: number
          cull_cow_value?: number
          calf_value_male?: number
          calf_value_female?: number
          depreciation_per_cow_per_year?: number
          currency_code?: string
          last_updated?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cost_entries: {
        Row: {
          id: string
          tenant_id: string
          entry_date: string
          cost_type: string
          category: string | null
          amount: number
          animal_id: string | null
          pen_id: string | null
          description: string | null
          reference_number: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          entry_date: string
          cost_type: string
          category?: string | null
          amount: number
          animal_id?: string | null
          pen_id?: string | null
          description?: string | null
          reference_number?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          entry_date?: string
          cost_type?: string
          category?: string | null
          amount?: number
          animal_id?: string | null
          pen_id?: string | null
          description?: string | null
          reference_number?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      milk_sales: {
        Row: {
          id: string
          tenant_id: string
          sale_date: string
          volume_kg: number
          avg_fat_percent: number | null
          avg_protein_percent: number | null
          avg_scc: number | null
          avg_lactose_percent: number | null
          base_price_per_kg: number | null
          quality_adjustment: number
          total_price_per_kg: number | null
          total_revenue: number | null
          buyer_name: string | null
          delivery_number: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          sale_date: string
          volume_kg: number
          avg_fat_percent?: number | null
          avg_protein_percent?: number | null
          avg_scc?: number | null
          avg_lactose_percent?: number | null
          base_price_per_kg?: number | null
          quality_adjustment?: number
          total_price_per_kg?: number | null
          total_revenue?: number | null
          buyer_name?: string | null
          delivery_number?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          sale_date?: string
          volume_kg?: number
          avg_fat_percent?: number | null
          avg_protein_percent?: number | null
          avg_scc?: number | null
          avg_lactose_percent?: number | null
          base_price_per_kg?: number | null
          quality_adjustment?: number
          total_price_per_kg?: number | null
          total_revenue?: number | null
          buyer_name?: string | null
          delivery_number?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      cow_valuations: {
        Row: {
          animal_id: string
          tenant_id: string
          production_value: number | null
          pregnancy_value: number | null
          genetic_value: number | null
          age_adjustment: number | null
          total_value: number | null
          relative_value: number | null
          valuation_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          animal_id: string
          tenant_id: string
          production_value?: number | null
          pregnancy_value?: number | null
          genetic_value?: number | null
          age_adjustment?: number | null
          total_value?: number | null
          relative_value?: number | null
          valuation_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          animal_id?: string
          tenant_id?: string
          production_value?: number | null
          pregnancy_value?: number | null
          genetic_value?: number | null
          age_adjustment?: number | null
          total_value?: number | null
          relative_value?: number | null
          valuation_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          category: string | null
          template_data: Json
          is_public: boolean
          is_system: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          category?: string | null
          template_data: Json
          is_public?: boolean
          is_system?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          category?: string | null
          template_data?: Json
          is_public?: boolean
          is_system?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          id: string
          tenant_id: string
          template_id: string
          schedule_config: Json
          last_run_at: string | null
          next_run_at: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          template_id: string
          schedule_config: Json
          last_run_at?: string | null
          next_run_at?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          template_id?: string
          schedule_config?: Json
          last_run_at?: string | null
          next_run_at?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      report_runs: {
        Row: {
          id: string
          tenant_id: string
          scheduled_report_id: string | null
          template_id: string
          run_at: string
          status: string
          row_count: number | null
          execution_time_ms: number | null
          output_url: string | null
          output_format: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          scheduled_report_id?: string | null
          template_id: string
          run_at?: string
          status: string
          row_count?: number | null
          execution_time_ms?: number | null
          output_url?: string | null
          output_format?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          scheduled_report_id?: string | null
          template_id?: string
          run_at?: string
          status?: string
          row_count?: number | null
          execution_time_ms?: number | null
          output_url?: string | null
          output_format?: string | null
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      animals_with_calculated: {
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
          pen_id: string | null
          pen_name: string | null
          current_status: AnimalStatus
          lactation_number: number
          last_calving_date: string | null
          reproductive_status: string | null
          last_milk_kg: number | null
          last_fat_percent: number | null
          last_protein_percent: number | null
          last_scc: number | null
          bcs_score: number | null
          rc_code: number | null
          dim: number | null
          dcc: number | null
          age_months: number | null
          days_open: number | null
          days_since_last_heat: number | null
          days_since_last_breeding: number | null
          due: number | null
          tbrd: number | null
          lgscc: number | null
          fcm: number | null
          totm: number | null
          totf: number | null
          totp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      // Phase 1: COUNT/SUM
      count_animals: {
        Args: { p_tenant_id: string; p_conditions: Json }
        Returns: number
      }
      count_by_group: {
        Args: { p_tenant_id: string; p_group_field: string; p_conditions?: Json }
        Returns: Json
      }
      calculate_aggregates: {
        Args: { p_tenant_id: string; p_field: string; p_fields?: string[]; p_conditions?: Json; p_group_by?: string; p_include_avg?: boolean; p_include_sum?: boolean }
        Returns: Json
      }
      get_animals_with_active_withdrawal: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      // Phase 2: BREDSUM
      calculate_bredsum_basic: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_bredsum_by_service: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_bredsum_by_month: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_bredsum_by_technician: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_bredsum_by_sire: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_bredsum_by_pen: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_bredsum_by_dim: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_bredsum_by_dow: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_bredsum_21day: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_bredsum_heat_detection: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_bredsum_qsum: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      // Phase 3: PLOT/GRAPH
      plot_by_dim: {
        Args: { p_tenant_id: string; p_lactation_number?: number; p_pen_id?: string }
        Returns: Json
      }
      plot_by_date: {
        Args: { p_tenant_id: string; p_start_date?: string; p_end_date?: string }
        Returns: Json
      }
      plot_by_lactation: {
        Args: { p_tenant_id: string; p_animal_id: string }
        Returns: Json
      }
      plot_by_pen: {
        Args: { p_tenant_id: string; p_field?: string }
        Returns: Json
      }
      get_average_lactation_curve: {
        Args: { p_tenant_id: string; p_lactation_number?: number }
        Returns: Json
      }
      graph_histogram: {
        Args: { p_tenant_id: string; p_field: string; p_bins?: number; p_pen_id?: string }
        Returns: Json
      }
      graph_scatter: {
        Args: { p_tenant_id: string; p_x_field: string; p_y_field: string; p_pen_id?: string }
        Returns: Json
      }
      graph_field_statistics: {
        Args: { p_tenant_id: string; p_field: string; p_pen_id?: string }
        Returns: Json
      }
      // Phase 4: Economics
      calculate_economics: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_iofc_by_pen: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_profitability_trends: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string; p_interval: string }
        Returns: Json
      }
      get_cost_breakdown: {
        Args: { p_tenant_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      // Phase 4: COWVAL
      calculate_cow_value: {
        Args: { p_animal_id: string }
        Returns: Json
      }
      update_cow_valuations: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_cowval_report: {
        Args: { p_tenant_id: string; p_sort_field?: string; p_limit?: number }
        Returns: Json
      }
      get_valuation_summary: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      // Notifications
      get_unread_notification_count: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      generate_daily_alerts: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      // Milk production
      get_daily_milk_production: {
        Args: { p_tenant_id: string; p_days?: number }
        Returns: Json
      }
      get_animal_milk_production: {
        Args: { p_tenant_id?: string; p_animal_id: string; p_days?: number }
        Returns: Json
      }
      get_latest_milking: {
        Args: { p_tenant_id?: string; p_animal_id?: string }
        Returns: Json
      }
      // Milk quality
      get_herd_quality_metrics: {
        Args: { p_tenant_id: string; p_days?: number }
        Returns: Json
      }
      get_bulk_tank_stats: {
        Args: { p_tenant_id: string; p_days?: number }
        Returns: Json
      }
      get_animals_with_high_scc: {
        Args: { p_tenant_id: string; p_threshold?: number }
        Returns: Json
      }
      get_latest_milk_test: {
        Args: { p_tenant_id?: string; p_animal_id: string }
        Returns: Json
      }
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
export type Notification = Tables<'notifications'>
export type MilkTest = Tables<'milk_tests'>
export type Bull = Tables<'bulls'>
export type ReportTemplate = Tables<'report_templates'>
export type CowValuation = Tables<'cow_valuations'>
