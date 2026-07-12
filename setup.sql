-- ============================================================================
-- setup.sql
-- Rode este script no SQL Editor do painel do Supabase (Project > SQL Editor).
-- Cria as tabelas do painel administrativo e configura as permissões (RLS).
-- ============================================================================

-- Tabela de eventos do site (visitas, cliques, visualizações de vídeo)
create table if not exists portfolio_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('page_view', 'button_click', 'video_view')),
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
  message text check (message is null or char_length(message) <= 4000),
  source text check (source in ('contact', 'popup')),
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

-- Leitura: só quem faz login no painel administrativo (usuários autenticados) pode ler
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
-- Escrita (INSERT): o site do portfólio é 100% estático (GitHub Pages/Vercel,
-- sem servidor próprio), então o navegador de cada visitante grava os eventos
-- diretamente, usando a chave anon. Isso é aceitável aqui porque:
--   1. Os dados gravados (visitas, cliques, mensagens) não são sensíveis;
--   2. A chave anon só pode INSERIR, nunca LER (não há policy de SELECT
--      para o papel anon), então ninguém consegue ver os dados de outra
--      pessoa nem os números do painel usando essa chave;
--   3. Os "check constraints" acima limitam o formato aceito nas colunas
--      mais importantes (event_type e tamanho da mensagem).
-- Se no futuro o site ganhar um servidor próprio, prefira mover essa escrita
-- para lá (com a chave de serviço) e remover as policies de insert abaixo.
-- ----------------------------------------------------------------------------
create policy "Site publico: inserir eventos"
  on portfolio_events
  for insert
  to anon
  with check (true);

create policy "Site publico: inserir mensagens de contato"
  on portfolio_leads
  for insert
  to anon
  with check (true);
