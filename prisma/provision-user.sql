-- Auto-provision a public."User" row whenever a new auth.users row is created.
-- This prevents foreign-key violations (P2003) when Prisma creates
-- UserSettings/Tasks/Notes/etc. for a freshly signed-up user.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, "createdAt", "updatedAt", theme, timezone, locale, "emailVerified")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW(),
    'system',
    'UTC',
    'en',
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill public."User" rows for any auth.users that already exist without a corresponding User row.
INSERT INTO public."User" (id, email, name, "createdAt", "updatedAt", theme, timezone, locale, "emailVerified")
SELECT
  u.id::text,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.created_at,
  u.created_at,
  'system',
  'UTC',
  'en',
  u.email_confirmed_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public."User" p WHERE p.id = u.id::text);
