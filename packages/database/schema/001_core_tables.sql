-- HerdMaster Pro - Core Database Schema
-- Multi-tenant architecture with Row Level Security (RLS)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANT MANAGEMENT
-- ============================================================================

CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'starter'
        CHECK (tier IN ('starter', 'professional', 'enterprise')),
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{"animals": 100, "users": 5}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- ============================================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('owner', 'manager', 'veterinarian', 'zootechnician', 'accountant', 'worker', 'viewer')),
    permissions JSONB DEFAULT '[]',
    avatar_url TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);

-- ============================================================================
-- FARM STRUCTURE
-- ============================================================================

CREATE TABLE public.barns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    capacity INTEGER,
    barn_type VARCHAR(50), -- 'milking', 'dry', 'calving', 'heifer', 'hospital'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE public.pens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    barn_id UUID REFERENCES public.barns(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER,
    pen_type VARCHAR(50), -- 'lactating', 'dry', 'fresh', 'hospital', 'breeding'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_barns_tenant ON public.barns(tenant_id);
CREATE INDEX idx_pens_tenant ON public.pens(tenant_id);
CREATE INDEX idx_pens_barn ON public.pens(barn_id);

-- ============================================================================
-- ANIMALS (Core Entity)
-- ============================================================================

CREATE TABLE public.animals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    -- Identity
    ear_tag VARCHAR(50) NOT NULL,
    registration_number VARCHAR(100),
    electronic_id VARCHAR(100), -- RFID
    name VARCHAR(100),

    -- Demographics
    birth_date DATE NOT NULL,
    breed VARCHAR(50) NOT NULL,
    sex VARCHAR(10) DEFAULT 'female' CHECK (sex IN ('male', 'female')),
    color VARCHAR(50),
    origin VARCHAR(20) DEFAULT 'homebred' CHECK (origin IN ('homebred', 'purchased')),
    entry_date DATE,

    -- Lineage
    sire_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
    dam_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
    sire_registration VARCHAR(100),
    dam_registration VARCHAR(100),

    -- Location
    pen_id UUID REFERENCES public.pens(id) ON DELETE SET NULL,
    current_status VARCHAR(30) DEFAULT 'heifer'
        CHECK (current_status IN ('heifer', 'lactating', 'dry', 'fresh', 'sold', 'dead', 'culled')),

    -- Reproduction (stored metrics)
    lactation_number INTEGER DEFAULT 0,
    last_calving_date DATE,
    reproductive_status VARCHAR(30),
    last_heat_date DATE,
    last_breeding_date DATE,
    pregnancy_confirmed_date DATE,
    expected_calving_date DATE,
    days_carried INTEGER GENERATED ALWAYS AS (
        CASE WHEN pregnancy_confirmed_date IS NOT NULL
             THEN CURRENT_DATE - last_breeding_date
             ELSE NULL END
    ) STORED,

    -- Production (last test results)
    last_test_date DATE,
    last_milk_kg DECIMAL(10,2),
    last_fat_percent DECIMAL(5,2),
    last_protein_percent DECIMAL(5,2),
    last_scc INTEGER,

    -- Health
    bcs_score DECIMAL(3,1), -- Body Condition Score 1.0-5.0
    last_vet_check_date DATE,

    -- Metadata
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- soft delete

    -- Sync support
    sync_version BIGINT DEFAULT 0,

    UNIQUE(tenant_id, ear_tag)
);

CREATE INDEX idx_animals_tenant ON public.animals(tenant_id);
CREATE INDEX idx_animals_status ON public.animals(tenant_id, current_status);
CREATE INDEX idx_animals_pen ON public.animals(pen_id);
CREATE INDEX idx_animals_ear_tag ON public.animals(tenant_id, ear_tag);
CREATE INDEX idx_animals_breed ON public.animals(tenant_id, breed);

-- ============================================================================
-- EVENTS (All animal events: breeding, calving, health, etc.)
-- ============================================================================

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,

    event_type VARCHAR(50) NOT NULL, -- 'breeding', 'calving', 'heat', 'pregnancy_check', 'dry_off', 'treatment', 'vaccination', etc.
    event_date DATE NOT NULL,
    event_time TIME,

    -- Flexible details storage
    details JSONB DEFAULT '{}',

    -- Audit
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Sync support
    sync_version BIGINT DEFAULT 0
);

CREATE INDEX idx_events_tenant ON public.events(tenant_id);
CREATE INDEX idx_events_animal ON public.events(animal_id);
CREATE INDEX idx_events_type ON public.events(tenant_id, event_type);
CREATE INDEX idx_events_date ON public.events(tenant_id, event_date DESC);

-- ============================================================================
-- LACTATIONS
-- ============================================================================

CREATE TABLE public.lactations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,

    lactation_number INTEGER NOT NULL,
    calving_date DATE NOT NULL,
    dry_date DATE,

    -- 305-day metrics
    days_in_milk INTEGER,
    total_milk_kg DECIMAL(10,2),
    me_305_milk DECIMAL(10,2), -- Mature Equivalent
    me_305_fat DECIMAL(10,2),
    me_305_protein DECIMAL(10,2),

    -- Peak
    peak_milk_kg DECIMAL(10,2),
    peak_dim INTEGER, -- Days in milk at peak

    -- Averages
    avg_fat_percent DECIMAL(5,2),
    avg_protein_percent DECIMAL(5,2),
    avg_scc INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, animal_id, lactation_number)
);

CREATE INDEX idx_lactations_tenant ON public.lactations(tenant_id);
CREATE INDEX idx_lactations_animal ON public.lactations(animal_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's tenant_id from JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid,
        (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION auth.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = required_role
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_animals_updated_at BEFORE UPDATE ON public.animals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lactations_updated_at BEFORE UPDATE ON public.lactations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lactations ENABLE ROW LEVEL SECURITY;

-- Tenants: users can only see their own tenant
CREATE POLICY tenant_isolation ON public.tenants
    FOR ALL USING (id = auth.tenant_id());

-- Profiles: users can see profiles in their tenant
CREATE POLICY profile_tenant_isolation ON public.profiles
    FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY profile_self_update ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- Barns: tenant isolation
CREATE POLICY barns_tenant_isolation ON public.barns
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

-- Pens: tenant isolation
CREATE POLICY pens_tenant_isolation ON public.pens
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

-- Animals: tenant isolation, exclude soft-deleted
CREATE POLICY animals_tenant_isolation ON public.animals
    FOR ALL USING (tenant_id = auth.tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = auth.tenant_id());

-- Events: tenant isolation
CREATE POLICY events_tenant_isolation ON public.events
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

-- Lactations: tenant isolation
CREATE POLICY lactations_tenant_isolation ON public.lactations
    FOR ALL USING (tenant_id = auth.tenant_id())
    WITH CHECK (tenant_id = auth.tenant_id());

-- ============================================================================
-- SEED DATA (for development)
-- ============================================================================

-- This will be run separately or via Supabase seed file
