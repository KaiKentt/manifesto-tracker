-- Make yourself an admin (run in Supabase → SQL Editor after signing up in the app).
-- Replace the email with the one you signed up with.
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
