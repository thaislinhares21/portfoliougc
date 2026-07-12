// ============================================================================
// js/auth.js
// Lógica de autenticação compartilhada entre login/index.html e painel.html.
// Cria o cliente Supabase uma única vez e expõe window.Auth para as páginas.
// ============================================================================

// Dados do projeto Supabase (chave pública/anon, segura para expor no front-end)
const SUPABASE_URL = "https://yyxwcbioceutosumfdbc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eHdjYmlvY2V1dG9zdW1mZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Mjk5NzcsImV4cCI6MjA5OTQwNTk3N30.PhD4cSa-WeKPFLSFJoEjLuBaScZ7nw5CiTTqSb-LvZU";

// Cliente Supabase único, compartilhado por toda a aplicação
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.Auth = {
  // Faz login com e-mail e senha. Lança um erro com mensagem amigável em caso de falha.
  async login(email, senha) {
    const { data, error } = await sb.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      if (error.message === "Invalid login credentials") {
        throw new Error("E-mail ou senha incorretos.");
      }
      throw new Error(error.message);
    }

    return data.user;
  },

  // Guarda de sessão: usada no topo de painel.html.
  // Se não houver sessão ativa, redireciona para /login/ e retorna null.
  async checkAuth() {
    const { data } = await sb.auth.getSession();

    if (!data.session) {
      window.location.href = "/login/";
      return null;
    }

    return data.session.user;
  },

  // Encerra a sessão e volta para a tela de login.
  async logout() {
    await sb.auth.signOut();
    window.location.href = "/login/";
  },

  // Envia e-mail de recuperação de senha via Supabase Auth.
  async recuperarSenha(email) {
    const { error } = await sb.auth.resetPasswordForEmail(email);
    if (error) {
      throw new Error(error.message);
    }
  },
};
