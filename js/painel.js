// ============================================================================
// js/painel.js
// Lógica do painel: guarda de sessão, busca paginada, cache em memória,
// filtro de período e renderização das abas "Menu Principal" e "Portfólio".
// ============================================================================

// Cache em memória dos dados carregados do Supabase (uma única busca por sessão de uso)
let CACHE_EVENTOS = [];
let CACHE_LEADS = [];
let PERIODO_ATUAL = "tudo";

// ----------------------------------------------------------------------------
// Busca paginada: o Supabase limita cada resposta a 1000 linhas, então
// buscamos em blocos de 1000 usando .range() até vir um bloco menor que 1000.
// ----------------------------------------------------------------------------
async function buscarTudo(tabela) {
  const TAMANHO_BLOCO = 1000;
  let inicio = 0;
  let todasAsLinhas = [];

  while (true) {
    const { data, error } = await sb
      .from(tabela)
      .select("*")
      .order("created_at", { ascending: false })
      .range(inicio, inicio + TAMANHO_BLOCO - 1);

    if (error) {
      throw new Error(`Erro ao carregar ${tabela}: ${error.message}`);
    }

    todasAsLinhas = todasAsLinhas.concat(data);

    if (data.length < TAMANHO_BLOCO) {
      break; // último bloco: acabou
    }
    inicio += TAMANHO_BLOCO;
  }

  return todasAsLinhas;
}

// ----------------------------------------------------------------------------
// Inicialização: guarda de sessão, carga dos dados e configuração da interface
// ----------------------------------------------------------------------------
(async function iniciar() {
  const usuario = await Auth.checkAuth();
  if (!usuario) return; // checkAuth já redirecionou para /login/

  document.getElementById("usuario-email").textContent = usuario.email;
  document.getElementById("botao-sair").addEventListener("click", () => Auth.logout());

  configurarAbas();
  configurarFiltroPeriodo();
  configurarMenuMobile();

  await carregarDados();

  // Revela o conteúdo só depois que tudo estiver pronto
  document.body.style.visibility = "visible";
})();

async function carregarDados() {
  try {
    const [eventos, leads] = await Promise.all([
      buscarTudo("portfolio_events"),
      buscarTudo("portfolio_leads"),
    ]);
    CACHE_EVENTOS = eventos;
    CACHE_LEADS = leads;
  } catch (erro) {
    console.error(erro);
    // Não trava a tela: mostra os blocos com estado vazio/erro amigável
    CACHE_EVENTOS = [];
    CACHE_LEADS = [];
    mostrarErroCarregamento();
  }

  redesenharTudo();
}

function mostrarErroCarregamento() {
  const aviso =
    '<p class="lista-vazia">Não foi possível carregar os dados agora. Tente recarregar a página.</p>';
  document.getElementById("lista-videos").innerHTML = aviso;
  document.getElementById("lista-botoes").innerHTML = aviso;
  document.getElementById("lista-contato-canais").innerHTML = aviso;
  document.getElementById("lista-mensagens").innerHTML = aviso;
}

// ----------------------------------------------------------------------------
// Abas (Menu Principal / Portfólio)
// ----------------------------------------------------------------------------
function configurarAbas() {
  const botoes = document.querySelectorAll(".nav-item[data-tab]");
  const titulos = {
    principal: "Menu Principal",
    portfolio: "Portfólio",
  };

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      const aba = botao.dataset.tab;

      document.querySelectorAll(".nav-item[data-tab]").forEach((b) => b.classList.remove("ativo"));
      botao.classList.add("ativo");

      document.getElementById("tab-principal").classList.add("oculto");
      document.getElementById("tab-portfolio").classList.add("oculto");
      document.getElementById(`tab-${aba}`).classList.remove("oculto");

      document.getElementById("titulo-pagina").textContent = titulos[aba];

      // Fecha a gaveta no celular ao escolher uma aba
      fecharSidebarMobile();
    });
  });
}

// ----------------------------------------------------------------------------
// Filtro de período (Tudo / 7d / 30d / 90d): só refiltra o cache, sem nova busca
// ----------------------------------------------------------------------------
function configurarFiltroPeriodo() {
  const botoes = document.querySelectorAll("#filtro-periodo button");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      botoes.forEach((b) => b.classList.remove("ativo"));
      botao.classList.add("ativo");
      PERIODO_ATUAL = botao.dataset.periodo;
      redesenharTudo();
    });
  });
}

function dataDeCorte(periodo) {
  if (periodo === "tudo") return null;

  const dias = { "7d": 7, "30d": 30, "90d": 90 }[periodo];
  const corte = new Date();
  corte.setDate(corte.getDate() - dias);
  corte.setHours(0, 0, 0, 0);
  return corte;
}

function filtrarPorPeriodo(linhas) {
  const corte = dataDeCorte(PERIODO_ATUAL);
  if (!corte) return linhas;
  return linhas.filter((linha) => new Date(linha.created_at) >= corte);
}

// ----------------------------------------------------------------------------
// Menu mobile (gaveta lateral)
// ----------------------------------------------------------------------------
function configurarMenuMobile() {
  const sidebar = document.getElementById("sidebar");
  const fundo = document.getElementById("fundo-escurecido");
  const botaoMenu = document.getElementById("botao-menu-mobile");

  botaoMenu.addEventListener("click", () => {
    sidebar.classList.add("aberta");
    fundo.classList.add("ativo");
  });

  fundo.addEventListener("click", fecharSidebarMobile);
}

function fecharSidebarMobile() {
  document.getElementById("sidebar").classList.remove("aberta");
  document.getElementById("fundo-escurecido").classList.remove("ativo");
}

// ----------------------------------------------------------------------------
// Redesenho geral: chamado ao carregar, ao trocar de período (não busca de novo)
// ----------------------------------------------------------------------------
function redesenharTudo() {
  const eventos = filtrarPorPeriodo(CACHE_EVENTOS);
  const leads = filtrarPorPeriodo(CACHE_LEADS);

  renderizarMenuPrincipal(eventos, leads);
  renderizarPortfolio(eventos, leads);
}

// ============================================================================
// Aba "Menu Principal"
// ============================================================================
function renderizarMenuPrincipal(eventos, leads) {
  const pageViews = eventos.filter((e) => e.event_type === "page_view");
  const cliques = eventos.filter((e) => e.event_type === "button_click");
  const videos = eventos.filter((e) => e.event_type === "video_view");
  const cliquesContato = cliques.filter((e) => e.event_name && e.event_name.startsWith("contact_"));

  const visitantesUnicos = new Set(pageViews.map((e) => e.session_id)).size;

  document.getElementById("num-visitas").textContent = formatarNumero(pageViews.length);
  document.getElementById("num-visitantes").textContent = formatarNumero(visitantesUnicos);
  document.getElementById("num-cliques").textContent = formatarNumero(cliques.length);
  document.getElementById("num-videos").textContent = formatarNumero(videos.length);
  document.getElementById("num-mensagens").textContent = formatarNumero(leads.length);
  document.getElementById("num-contato").textContent = formatarNumero(cliquesContato.length);

  renderizarGrafico14Dias(pageViews);
}

function formatarNumero(n) {
  return n.toLocaleString("pt-BR");
}

function renderizarGrafico14Dias(pageViews) {
  const container = document.getElementById("grafico-14-dias");
  const dias = [];

  // Monta os últimos 14 dias (hoje incluso), do mais antigo para o mais recente
  for (let i = 13; i >= 0; i--) {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    data.setDate(data.getDate() - i);
    dias.push({ data, contagem: 0 });
  }

  pageViews.forEach((evento) => {
    const dataEvento = new Date(evento.created_at);
    dataEvento.setHours(0, 0, 0, 0);
    const dia = dias.find((d) => d.data.getTime() === dataEvento.getTime());
    if (dia) dia.contagem++;
  });

  const maiorContagem = Math.max(1, ...dias.map((d) => d.contagem));

  container.innerHTML = dias
    .map((dia) => {
      const alturaPercentual = Math.max(2, (dia.contagem / maiorContagem) * 100);
      const rotuloDia = dia.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      return `
        <div class="grafico-barra-coluna">
          <div class="tooltip-barra">${rotuloDia}: ${dia.contagem}</div>
          <div class="grafico-barra" style="height: ${alturaPercentual}%;"></div>
          <div class="rotulo-dia">${rotuloDia}</div>
        </div>
      `;
    })
    .join("");
}

// ============================================================================
// Aba "Portfólio"
// ============================================================================
function renderizarPortfolio(eventos, leads) {
  renderizarVideosMaisVistos(eventos);
  renderizarBotoesMaisClicados(eventos);
  renderizarCliquesContato(eventos);
  renderizarMensagens(leads);
}

// --- Bloco 1: Vídeos mais vistos --------------------------------------------
function renderizarVideosMaisVistos(eventos) {
  const container = document.getElementById("lista-videos");
  const videos = eventos.filter((e) => e.event_type === "video_view");

  if (videos.length === 0) {
    container.innerHTML = '<p class="lista-vazia">Nenhum vídeo assistido ainda.</p>';
    return;
  }

  const agrupado = {};
  videos.forEach((evento) => {
    const id = evento.event_name;
    if (!agrupado[id]) {
      const titulo = evento.metadata && evento.metadata.title ? evento.metadata.title : id;
      agrupado[id] = { id, titulo, contagem: 0 };
    }
    agrupado[id].contagem++;
  });

  const lista = Object.values(agrupado).sort((a, b) => b.contagem - a.contagem);
  const maiorContagem = lista[0].contagem;

  container.innerHTML = lista
    .map((video) => {
      const largura = Math.max(4, (video.contagem / maiorContagem) * 100);
      const linkYoutube = `https://www.youtube.com/watch?v=${video.id}`;
      const miniatura = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
      return `
        <div class="item-video">
          <a href="${linkYoutube}" target="_blank" rel="noopener">
            <img src="${miniatura}" alt="${escapeHtml(video.titulo)}" loading="lazy" />
          </a>
          <div class="item-video-info">
            <a class="titulo-video" href="${linkYoutube}" target="_blank" rel="noopener">${escapeHtml(video.titulo)}</a>
            <div class="barra-proporcional">
              <div class="preenchimento" style="width: ${largura}%;"></div>
            </div>
          </div>
          <div class="item-video-contagem">${formatarNumero(video.contagem)} visualizações</div>
        </div>
      `;
    })
    .join("");
}

// --- Bloco 2: Botões mais clicados -------------------------------------------
function renderizarBotoesMaisClicados(eventos) {
  const container = document.getElementById("lista-botoes");
  const cliques = eventos.filter((e) => e.event_type === "button_click");

  if (cliques.length === 0) {
    container.innerHTML = '<p class="lista-vazia">Nenhum clique registrado ainda.</p>';
    return;
  }

  const agrupado = {};
  cliques.forEach((evento) => {
    const nome = evento.event_name || "desconhecido";
    agrupado[nome] = (agrupado[nome] || 0) + 1;
  });

  const lista = Object.entries(agrupado)
    .map(([nome, contagem]) => ({ nome, contagem }))
    .sort((a, b) => b.contagem - a.contagem);

  const maiorContagem = lista[0].contagem;

  container.innerHTML = lista
    .map((item) => {
      const largura = Math.max(4, (item.contagem / maiorContagem) * 100);
      return `
        <div class="item-barra-h">
          <div class="cabecalho-barra-h">
            <span>${escapeHtml(nomeLegivel(item.nome))}</span>
            <span class="contagem">${formatarNumero(item.contagem)}</span>
          </div>
          <div class="barra-proporcional">
            <div class="preenchimento" style="width: ${largura}%;"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function nomeLegivel(nome) {
  return nome
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

// --- Bloco 3: Cliques para contato -------------------------------------------
function renderizarCliquesContato(eventos) {
  const container = document.getElementById("lista-contato-canais");
  const cliquesContato = eventos.filter(
    (e) => e.event_type === "button_click" && e.event_name && e.event_name.startsWith("contact_")
  );

  if (cliquesContato.length === 0) {
    container.innerHTML = '<p class="lista-vazia">Nenhum clique para contato ainda.</p>';
    return;
  }

  const agrupado = {};
  cliquesContato.forEach((evento) => {
    agrupado[evento.event_name] = (agrupado[evento.event_name] || 0) + 1;
  });

  const lista = Object.entries(agrupado)
    .map(([nome, contagem]) => ({ nome, contagem }))
    .sort((a, b) => b.contagem - a.contagem);

  container.innerHTML = `
    <div class="lista-contato">
      ${lista
        .map(
          (item) => `
        <div class="item-contato">
          <span class="nome-canal">${escapeHtml(nomeLegivel(item.nome.replace(/^contact_/, "")))}</span>
          <span class="contagem-canal">${formatarNumero(item.contagem)}</span>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

// --- Bloco 4: Mensagens recebidas --------------------------------------------
function renderizarMensagens(leads) {
  const container = document.getElementById("lista-mensagens");

  if (leads.length === 0) {
    container.innerHTML = '<p class="lista-vazia">Nenhuma mensagem por enquanto.</p>';
    return;
  }

  // Já vem ordenado por created_at decrescente (a busca usa order + range),
  // mas reordenamos aqui por garantia, já que o filtro de período não altera a ordem.
  const ordenados = [...leads].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  container.innerHTML = `
    <div class="lista-mensagens">
      ${ordenados.map((lead, indice) => renderizarCartaoMensagem(lead, indice)).join("")}
    </div>
  `;

  // Expandir/recolher ao clicar no cabeçalho do cartão
  container.querySelectorAll(".cartao-mensagem-cabecalho").forEach((cabecalho) => {
    cabecalho.addEventListener("click", () => {
      cabecalho.closest(".cartao-mensagem").classList.toggle("expandido");
    });
  });
}

function renderizarCartaoMensagem(lead, indice) {
  const dataFormatada = new Date(lead.created_at).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const origem = lead.source === "popup" ? "popup" : "contact";
  const seloClasse = origem === "popup" ? "selo-popup" : "selo-contact";

  const telefoneDigitos = (lead.phone || "").replace(/\D/g, "");
  const botaoWhatsapp = telefoneDigitos
    ? `<a href="https://wa.me/${telefoneDigitos}" target="_blank" rel="noopener" class="botao botao-secundario">WhatsApp</a>`
    : "";

  return `
    <div class="cartao-mensagem" id="mensagem-${indice}">
      <div class="cartao-mensagem-cabecalho">
        <div class="cartao-mensagem-info">
          <span class="selo ${seloClasse}">${origem}</span>
          <span class="cartao-mensagem-nome">${escapeHtml(lead.name || "Sem nome")}</span>
          <span class="cartao-mensagem-data">${dataFormatada}</span>
        </div>
        <span class="cartao-mensagem-data">${escapeHtml(lead.email || "")}</span>
      </div>

      <div class="cartao-mensagem-detalhes">
        ${lead.phone ? `<div class="linha-detalhe"><strong>Telefone:</strong> ${escapeHtml(lead.phone)}</div>` : ""}
        ${lead.brand ? `<div class="linha-detalhe"><strong>Marca:</strong> ${escapeHtml(lead.brand)}</div>` : ""}
        ${lead.budget ? `<div class="linha-detalhe"><strong>Orçamento:</strong> ${escapeHtml(lead.budget)}</div>` : ""}
        ${lead.message ? `<div class="linha-detalhe"><strong>Mensagem:</strong> ${escapeHtml(lead.message)}</div>` : ""}

        <div class="acoes-mensagem">
          <a href="mailto:${encodeURIComponent(lead.email || "")}" class="botao botao-primario">Responder por e-mail</a>
          ${botaoWhatsapp}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// Utilitário simples para evitar problemas de HTML ao exibir texto vindo do banco
// ----------------------------------------------------------------------------
function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = String(texto == null ? "" : texto);
  return div.innerHTML;
}
