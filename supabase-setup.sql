-- ========================================
-- Snow Plow Sales - Supabase Database Setup
-- Run this in your Supabase SQL Editor
-- ========================================

-- 1. Create equipment table
CREATE TABLE equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    price_display TEXT,
    model TEXT,
    manufacturer TEXT,
    year INTEGER,
    condition TEXT NOT NULL CHECK (condition IN ('new', 'used')) DEFAULT 'new',
    hours INTEGER,
    serial_number TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'draft', 'sold')) DEFAULT 'draft',
    sort_order INTEGER,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create equipment_images table
CREATE TABLE equipment_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    alt_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_condition ON equipment(condition);
CREATE INDEX idx_equipment_sort ON equipment(sort_order);
CREATE INDEX idx_equipment_images_equipment_id ON equipment_images(equipment_id);

-- 4. Enable Row Level Security
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_images ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Equipment

-- Public can read active equipment
CREATE POLICY "Public can read active equipment"
    ON equipment FOR SELECT
    TO anon
    USING (status = 'active');

-- Authenticated users have full access
CREATE POLICY "Authenticated full access to equipment"
    ON equipment FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. RLS Policies - Equipment Images

-- Public can read images for active equipment
CREATE POLICY "Public can read images for active equipment"
    ON equipment_images FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM equipment
            WHERE equipment.id = equipment_images.equipment_id
            AND equipment.status = 'active'
        )
    );

-- Authenticated users have full access to images
CREATE POLICY "Authenticated full access to images"
    ON equipment_images FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ========================================
-- STORAGE SETUP
-- Run these after creating the bucket in the Supabase dashboard:
-- 1. Go to Storage > Create bucket "equipment-photos" (public)
-- 2. Then run the policies below in SQL Editor
-- ========================================

-- Storage Policies for equipment-photos bucket

-- Public can read all files
CREATE POLICY "Public read access to equipment photos"
    ON storage.objects FOR SELECT
    TO anon
    USING (bucket_id = 'equipment-photos');

-- Authenticated can upload
CREATE POLICY "Authenticated upload to equipment photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'equipment-photos');

-- Authenticated can update
CREATE POLICY "Authenticated update equipment photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'equipment-photos');

-- Authenticated can delete
CREATE POLICY "Authenticated delete equipment photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'equipment-photos');

-- ========================================
-- SAMPLE DATA (optional - remove or modify)
-- ========================================

INSERT INTO equipment (title, description, condition, status, manufacturer, model, sort_order) VALUES
    ('Fisher XV2 8''6" V-Plow', 'Stainless steel, Minute Mount 2, Fleet Flex wiring', 'new', 'active', 'Fisher', 'XV2', 1),
    ('Fisher HDX 8'' Straight Blade', 'Trip-edge, high-carbon steel, Minute Mount 2', 'new', 'active', 'Fisher', 'HDX', 2),
    ('Fisher Poly-Caster 2.0 yd Hopper Spreader', 'Poly hopper, variable speed, pintle chain conveyor', 'new', 'active', 'Fisher', 'Poly-Caster', 3),
    ('Toro Power Max HD 1428 OHXE', '28" commercial two-stage gas snow blower', 'new', 'active', 'Toro', 'Power Max HD 1428', 4),
    ('Toro TimeCutter 50" MyRide Zero Turn', '50" deck, MyRide suspension, 23 HP Kohler engine', 'new', 'active', 'Toro', 'TimeCutter', 5),
    ('Toro Power Clear e21 60V Snow Blower', '21" clearing width, 60V battery powered, single stage', 'new', 'active', 'Toro', 'Power Clear e21', 6),
    ('Fisher 7.5'' SD Straight Blade', 'Used, good condition. Call for details.', 'used', 'active', 'Fisher', 'SD', 7),
    ('Fisher Steel-Caster 1.5 yd Spreader', 'Used, serviced and ready to go. Call for pricing.', 'used', 'active', 'Fisher', 'Steel-Caster', 8);
