-- Add user to admins table (used by is_admin() RPC)
INSERT INTO public.admins (user_id)
VALUES ('d89db35f-9b06-4b5b-a198-fc14b7fb734e')
ON CONFLICT (user_id) DO NOTHING;