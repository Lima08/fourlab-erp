-- Fourlab ERP seed — local `supabase db reset` / db:seed
-- Admin: jplima08.dev@gmail.com / jplima08.dev@gmail.com

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_user_id uuid := '11111111-1111-1111-1111-111111111111';
  v_encrypted_pw text;
BEGIN
  v_encrypted_pw := crypt('jplima08.dev@gmail.com', gen_salt('bf'));

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'jplima08.dev@gmail.com',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"JP Lima"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    format('{"sub":"%s","email":"jplima08.dev@gmail.com"}', v_user_id)::jsonb,
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;
END $$;

INSERT INTO public.profiles (id, full_name, email, is_active, activated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'JP Lima',
  'jplima08.dev@gmail.com',
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active,
  activated_at = COALESCE(public.profiles.activated_at, EXCLUDED.activated_at);

INSERT INTO public.financial_categories (id, name, type) VALUES
  ('22222222-2222-2222-2222-222222220001', 'Vendas', 'revenue'),
  ('22222222-2222-2222-2222-222222220002', 'Materiais', 'expense'),
  ('22222222-2222-2222-2222-222222220003', 'Contas fixas', 'expense'),
  ('22222222-2222-2222-2222-222222220004', 'Insumos gerais', 'expense'),
  ('22222222-2222-2222-2222-222222220005', 'Outras despesas', 'expense')
ON CONFLICT (name, type) DO NOTHING;
