-- Add RC code column to animals table
-- RC (Reproductive Code) is a numeric code used in DairyComp:
-- 0 = Blank (no status)
-- 1 = DNB (Do Not Breed)
-- 2 = FRESH (recently calved, <21 DIM)
-- 3 = OPEN (not bred, ready to breed)
-- 4 = BRED (inseminated, awaiting preg check)
-- 5 = PREG (confirmed pregnant)
-- 6 = DRY (dried off, awaiting calving)
-- 7 = SOLD/DIED (culled)
-- 8 = BULLCALF

ALTER TABLE public.animals
ADD COLUMN IF NOT EXISTS rc_code INTEGER DEFAULT 0 CHECK (rc_code >= 0 AND rc_code <= 8);

COMMENT ON COLUMN public.animals.rc_code IS 'DairyComp reproductive code (0-8)';

-- Create index for faster filtering by RC
CREATE INDEX IF NOT EXISTS idx_animals_rc_code ON public.animals(tenant_id, rc_code);

-- Update existing animals with sensible defaults based on current_status
UPDATE public.animals
SET rc_code = CASE
    WHEN current_status = 'heifer' THEN 0
    WHEN current_status = 'fresh' THEN 2
    WHEN current_status = 'lactating' THEN 3
    WHEN current_status = 'dry' THEN 6
    WHEN current_status = 'sold' OR current_status = 'died' THEN 7
    ELSE 0
END
WHERE rc_code = 0 OR rc_code IS NULL;
