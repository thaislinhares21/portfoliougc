-- ============================================================================
-- setup.sql
-- Rode este script no SQL Editor do painel do Supabase (Project > SQL Editor).
-- Cria as tabelas do painel administrativo e configura as permissões (RLS).
-- ============================================================================

-- Tabela de eventos do site (visitas, cliques, visualizações de vídeo)
create table if not exists portfolio_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,       -- 'page_view' | 'button_click' | 'video_view'
  event_name text,                -- nome do evento (ex.: id do vídeo, nome do botão)
  session_id text,                -- identifica um visitante dentro de uma sessão
  page_path text,                 -- caminho da página onde o evento ocorreu
  metadata jsonb,                 -- dados extras (title, brand, category, etc.)
  created_at timestamptz not null default now()
);

-- Tabela de mensagens de contato (formulário e pop-up do portfólio)
create table if not exists portfolio_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  brand text,
  budget text,
  message text,
  source text,                    -- 'contact' | 'popup'
  created_at timestamptz not null default now()
);

-- Índices para acelerar consultas por data, que é o filtro mais usado no painel
create index if not exists idx_portfolio_events_created_at on portfolio_events (created_at desc);
create index if not exists idx_portfolio_leads_created_at on portfolio_leads (created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------
alter table portfolio_events enable row level security;
alter table portfolio_leads enable row level security;

-- Permite que qualquer usuário autenticado (quem faz login no painel) leia os dados
create policy "Painel: leitura de eventos para autenticados"
  on portfolio_events
  for select
  to authenticated
  using (true);

create policy "Painel: leitura de leads para autenticados"
  on portfolio_leads
  for select
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- IMPORTANTE sobre escrita (INSERT):
-- Nenhuma policy de INSERT foi criada aqui de propósito. O site público do
-- portfólio (que roda no navegador de qualquer visitante) NÃO deve gravar
-- eventos ou leads usando a chave anon diretamente do front-end, porque
-- qualquer pessoa poderia inspecionar o código e inserir dados falsos.
--
-- A gravação de portfolio_events e portfolio_leads deve ser feita por um
-- servidor (ex.: uma função serverless/Edge Function) usando a chave de
-- serviço (service_role), que ignora RLS e nunca deve ser exposta no
-- navegador. O painel administrativo aqui criado só LÊ os dados.
-- ----------------------------------------------------------------------------
