# Painel administrativo (meu.painel)

Painel para acompanhar os números do portfólio (visitas, cliques, vídeos vistos e
mensagens de contato), com login via Supabase Auth. HTML, CSS e JavaScript puro,
sem build e sem Node, abre direto no navegador.

## Arquivos

- `login/index.html`: tela de login (fica em `thaislinhares.com.br/login`).
- `painel.html`: painel interno (protegido por sessão).
- `js/auth.js`: cliente Supabase e funções de login/logout/sessão.
- `js/painel.js`: busca dos dados, filtros e renderização do painel.
- `css/style.css`: design system (cores, tipografia, componentes).
- `setup.sql`: script para criar as tabelas e permissões no Supabase.

## Passo a passo

1. **Rode o `setup.sql`**: abra o painel do Supabase → SQL Editor → cole o
   conteúdo de `setup.sql` → Run. Isso cria as tabelas `portfolio_events` e
   `portfolio_leads` com a segurança (RLS) já configurada.

2. **Crie seu usuário de login**: no painel do Supabase, vá em
   Authentication → Users → Add user, e cadastre seu e-mail e uma senha.
   É esse e-mail/senha que você vai usar na tela de login (não é o mesmo
   login do painel do Supabase).

3. **Teste localmente**: como os arquivos são estáticos, basta abrir a
   pasta em um servidor simples (abrir `login/index.html` direto com duplo
   clique também funciona, mas alguns navegadores bloqueiam certas
   requisições em `file://`). Um jeito fácil, com Python instalado:
   `python -m http.server 8000` na pasta do projeto, depois acesse
   `http://localhost:8000/login/`.

4. **Publique no GitHub Pages**: suba estes arquivos para o repositório do
   seu site (o mesmo que já serve `thaislinhares.com.br`). O `index.html` do
   portfólio continua sendo a home do site, sem qualquer alteração. Como o
   login fica na pasta `login/` com um `index.html` dentro, acesse direto por
   `thaislinhares.com.br/login` (sem precisar do `.html`).

5. **Ou publique na Vercel**: importe o mesmo repositório na Vercel como
   projeto estático (sem framework). Depois de publicado, acesse `/login`
   no domínio gerado.

6. **Garanta que o site público NUNCA grava dados com a chave anon**: a
   chave anon usada aqui só tem permissão de leitura (SELECT) para usuários
   autenticados. A gravação de eventos e mensagens deve vir de um servidor
   com a chave de serviço (veja o comentário no final de `setup.sql`).

---

**Resumo em 3 linhas:** para testar localmente, rode um servidor estático
(ex.: `python -m http.server`) e abra `login/index.html`; para criar seu
login, cadastre um usuário em Authentication → Users no painel do Supabase;
para publicar, suba os arquivos ao repositório do site (GitHub Pages) ou
importe como projeto estático na Vercel e acesse `/login`.
