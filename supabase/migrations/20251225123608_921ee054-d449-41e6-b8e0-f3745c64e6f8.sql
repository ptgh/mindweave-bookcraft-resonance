-- Update your user role from 'user' to 'admin'
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'd89db35f-9b06-4b5b-a198-fc14b7fb734e';