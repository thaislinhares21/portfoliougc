// ============================================================================
// js/tracking.js
// Registra eventos de uso do site público (visitas, cliques, vídeos e
// mensagens de contato) no Supabase, para alimentar o painel administrativo.
// Depende de js/supabase-config.js já ter sido carregado (define "sb").
//
// Nunca deve travar a navegação do visitante: qualquer erro é só avisado
// no console, sem interromper o que a pessoa está fazendo no site.
// ============================================================================

(function () {
  // Identifica a sessão do visitante (mesmo id enquanto a aba ficar aberta)
  function idDeSessao() {
    let id = sessionStorage.getItem("thais_session_id");
    if (!id) {
      id = window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem("thais_session_id", id);
    }
    return id;
  }

  async function registrarEvento(eventType, eventName, metadata) {
    try {
      const { error } = await sb.from("portfolio_events").insert({
        event_type: eventType,
        event_name: eventName || null,
        session_id: idDeSessao(),
        page_path: window.location.pathname,
        metadata: metadata || null,
      });
      if (error) console.warn("Falha ao registrar evento:", error.message);
    } catch (erro) {
      console.warn("Falha ao registrar evento:", erro);
    }
  }

  async function registrarLead(lead) {
    try {
      const { error } = await sb.from("portfolio_leads").insert(lead);
      if (error) console.warn("Falha ao registrar mensagem:", error.message);
    } catch (erro) {
      console.warn("Falha ao registrar mensagem:", erro);
    }
  }

  window.Tracking = {
    // Visita à página (uma vez por carregamento)
    pageView() {
      registrarEvento("page_view", null, null);
    },
    // Clique em botão/link (ex.: "contact_whatsapp", "cta_fale_comigo")
    buttonClick(nome, metadata) {
      registrarEvento("button_click", nome, metadata);
    },
    // Visualização de vídeo (event_name = id do vídeo no YouTube)
    videoView(idVideo, titulo) {
      registrarEvento("video_view", idVideo, titulo ? { title: titulo } : null);
    },
    // Mensagem de contato (formulário ou pop-up)
    lead(dados) {
      registrarLead(dados);
    },
  };

  // Registra a visita assim que o script carrega
  window.Tracking.pageView();
})();
