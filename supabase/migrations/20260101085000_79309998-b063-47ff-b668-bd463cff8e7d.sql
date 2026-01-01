-- Make hafizsalik881@gmail.com an admin
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'hafizsalik881@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;