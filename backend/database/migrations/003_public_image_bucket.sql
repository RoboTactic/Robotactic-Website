-- Supabase Storage bucket for public event images. Uploads still require
-- the server-only service role key and the authenticated admin endpoint.
DO $$
BEGIN
    IF to_regclass('storage.buckets') IS NOT NULL THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'robotactic-images',
            'robotactic-images',
            TRUE,
            5242880,
            ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
