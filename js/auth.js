// ============================================================================
// js/auth.js
// Lógica de autenticação compartilhada entre login/index.html e painel.html.
// Depende de js/supabase-config.js já ter sido carregado (define "sb").
// ============================================================================

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
