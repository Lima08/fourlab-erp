-- Insert admin user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  '00000000-0000-0000-0000-000000000000',
  'test@soraia.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
  id,
  full_name,
  email,
  phone,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'Técnico de Testes',
  'test@soraia.com',
  '(11) 99999-9999',
  'admin',
  'ativo',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Entidade cliente (negócio) — separada do usuário de acesso
INSERT INTO public.clients (
  id,
  name,
  phone,
  created_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
  'Condomínio Residencial Fonte dos Pássaros',
  '(11) 3384-0369',
  now()
) ON CONFLICT (id) DO NOTHING;

-- Usuário cliente vinculado à entidade
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '00000000-0000-0000-0000-000000000000',
  'client-a0eebc99@pending.internal',
  crypt('pending-invite', gen_salt('bf')),
  NULL,
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
  id,
  full_name,
  email,
  phone,
  role,
  status,
  client_id,
  created_at,
  updated_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Síndico Teste',
  'client-a0eebc99@pending.internal',
  '(11) 3384-0369',
  'cliente',
  'convite_pendente',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Projeto vinculado à entidade cliente (não ao usuário)
INSERT INTO public.projects (
  id,
  client_id,
  responsible_profile_id,
  name,
  description,
  street,
  number,
  complement,
  neighborhood,
  city,
  state,
  postal_code,
  status,
  total_area,
  document_type,
  document_storage_path,
  created_at
) VALUES (
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10',
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'Condomínio Residencial Fonte dos Pássaros',
  'Vistoria baseada em laudo real: Blocos A, B e áreas externas.',
  'Rua da Fonte',
  '275',
  'Blocos A e B',
  'Perdizes',
  'São Paulo',
  'SP',
  '05001-000',
  'in_progress',
  12500.00,
  'PT_APPROVED',
  NULL,
  now()
) ON CONFLICT (id) DO NOTHING;

-- Insert Locations
INSERT INTO public.locations (id, project_id, name, type) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Térreo - Hall de Entrada', 'floor'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Área Externa', 'outdoor'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Bloco A - 9º Andar', 'floor'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Escadas', 'other'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Portaria', 'room')
ON CONFLICT (id) DO NOTHING;

-- Insert Items
INSERT INTO public.items (id, project_id, location_id, description, category, status, technician_id) VALUES
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '[IT-17] Ausência de mangueira de incêndio de 1.1/2" no abrigo', 'other', 'irregular', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', '[IT-22] Abrigo inexistente para os 4 cilindros de GLP P-190Kg', 'other', 'irregular', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', '[IT-15] Extintores de Pó BC e Água Pressurizada', 'extinguisher', 'regular', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b04', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', '[IT-11] Fixar corretamente a luminária autônoma no teto', 'lighting', 'irregular', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b05', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', '[IT-13] Realizar o endereçamento dos dispositivos na central digital', 'alarm', 'irregular', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b06', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', '[IT-10] Corrimãos descontínuos e ausência de fitas antiderrapantes', 'emergency_exit', 'irregular', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33')
ON CONFLICT (id) DO NOTHING;

-- Insert Evidence
INSERT INTO public.evidence (id, item_id, type, comment, technician_id) VALUES
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'comment', 'Foi constatado durante vistoria técnica prévia que a caixa estava vazia e lacre rompido.', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33')
ON CONFLICT (id) DO NOTHING;
