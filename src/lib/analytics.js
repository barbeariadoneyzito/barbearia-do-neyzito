import { base44 } from "@/api/base44Client";

// Rastreia visitas e cliques na landing page (NÃO registra lead nem agendamento).
// Reaproveita os pontos de rastreamento existentes (trackCta/trackSocial) e envia
// os eventos para a função registrarAnalytics, que valida, classifica o canal
// (Google Meu Negócio, Google Ads, IA, social, direto) e grava na entidade
// AnalyticsEvent. Também mantém o ping nativo da plataforma (fire-and-forget).
// Regra de privacidade: nenhum dado pessoal (nome/telefone/e-mail) é coletado aqui.
// Visitante único estimado = sessao_id persistido em localStorage; visita contada
// 1x por sessão por página (sessionStorage); cliques deduplicados em 2s.

const SESSION_KEY = "neyzito_sid";
const VISIT_KEY = "neyzito_visits";
const CLICK_KEY = "neyzito_clicks";

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function getSessionId() {
  try {
    let s = localStorage.getItem(SESSION_KEY);
    if (!s) {
      s = uuid();
      localStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2);
  }
}

// Contexto de aquisição reutilizável: UTMs + gclid + página + sessão anônima +
// referrer. Usado pelo modal de agendamento (e pelo chat) para gravar no Lead a
// mesma sessao_id dos eventos de navegação, vinculando o lead à sua jornada. O
// referrer cobre quem chega sem UTM (ex.: Google Meu Negócio, plataformas de IA).
export function getCampaignContext() {
  const utms = getUtms();
  return {
    utm_source: utms.utm_source,
    utm_medium: utms.utm_medium,
    utm_campaign: utms.utm_campaign,
    gclid: utms.gclid,
    referrer: getReferrer(),
    pagina_entrada: (typeof window !== "undefined" && window.location.pathname) || "/",
    sessao_id: getSessionId(),
  };
}

// Referrer do primeiro acesso, preservado em sessionStorage (ao navegar dentro
// do site o document.referrer passa a ser o próprio site e deixaria de informar
// a origem real). Vazio em acesso direto.
export function getReferrer() {
  let cached = "";
  try {
    cached = sessionStorage.getItem("neyzito_referrer") || "";
  } catch {}
  if (cached) return cached;
  let ref = "";
  try {
    ref = (typeof document !== "undefined" && document.referrer) || "";
    // Ignora referrer do próprio site (navegação interna).
    if (ref && typeof window !== "undefined" && ref.includes(window.location.host)) ref = "";
  } catch {}
  try {
    if (ref) sessionStorage.setItem("neyzito_referrer", ref);
  } catch {}
  return ref;
}

// Plataformas de IA reconhecidas no referrer/UTM (mesma lista do backend).
const AI_RE =
  /chatgpt|chat\.openai|openai\.com|gemini|bard\.google|perplexity|claude\.ai|anthropic|copilot|you\.com|poe\.com|meta\.ai|grok|deepseek|mistral/;

// Mapeia UTMs + referrer para a lista padronizada de origens do Lead. Cobre o
// caso sem UTM (Google Meu Negócio, IA, redes) para o lead já nascer com a
// origem certa — sem evidência suficiente devolve "Não identificado".
export function origemFromContext(ctx) {
  const s = (ctx?.utm_source || "").toLowerCase();
  const ref = (ctx?.referrer || "").toLowerCase();
  if (AI_RE.test(s) || AI_RE.test(ref)) return "Plataforma de IA";
  if (/google_meu_negocio|google_my_business|gmb|perfil_gmb|perfil_google|google_business/.test(s)) return "Google Meu Negócio";
  if (s === "google" || s === "googlesearch") return "Google Pesquisa";
  if (s === "maps" || s === "googlemaps" || s === "google_maps" || s === "gbp") return "Google Meu Negócio";
  if (s === "instagram" || /instagram\.com/.test(ref)) return "Instagram";
  if (s === "facebook" || /facebook\.com/.test(ref)) return "Facebook";
  if (s === "tiktok" || /tiktok\.com/.test(ref)) return "TikTok";
  if (s === "linkedin" || /linkedin\.com/.test(ref)) return "LinkedIn";
  if (s === "whatsapp" || /wa\.me|whatsapp\.com/.test(ref)) return "WhatsApp Business";
  if (s === "appbarber") return "AppBarber";
  // Referrer da ficha do Google (Perfil da Empresa) = Google Meu Negócio.
  if (/maps\.google|google\.[a-z.]+\/maps|google\.com\/local|business\.google|local\.google|g\.page/.test(ref))
    return "Google Meu Negócio";
  if (/google\./.test(ref)) return "Google Pesquisa";
  return "Não identificado";
}

// UTMs + gclid: captura da URL na primeira visita e preserva em sessionStorage
// ao navegar (o gclid do Google Ads só está presente no primeiro carregamento).
function getUtms() {
  let cached = null;
  try {
    cached = JSON.parse(sessionStorage.getItem("neyzito_campaign"));
  } catch {}
  const params = new URLSearchParams(window.location.search);
  const ctx = {
    utm_source: params.get("utm_source") || cached?.utm_source || "",
    utm_medium: params.get("utm_medium") || cached?.utm_medium || "",
    utm_campaign: params.get("utm_campaign") || cached?.utm_campaign || "",
    gclid: params.get("gclid") || cached?.gclid || "",
  };
  try {
    sessionStorage.setItem("neyzito_campaign", JSON.stringify(ctx));
  } catch {}
  return ctx;
}

export function getDevice() {
  try {
    const ua = navigator.userAgent || "";
    const w = window.innerWidth || 0;
    if (/tablet|ipad/i.test(ua)) return "tablet";
    if (/mobi|android|iphone|ipod/i.test(ua)) return "mobile";
    if (w > 0 && w <= 768) return "mobile";
    if (w > 0 && w <= 1024) return "tablet";
    return "desktop";
  } catch {
    return "outro";
  }
}

function send(payload) {
  // Grava na entidade via função (validada e classificada). Falha nunca bloqueia,
  // mas agora é registrada no console para diagnosticar envios perdidos.
  try {
    base44.functions.invoke("registrarAnalytics", payload).catch((err) => {
      console.warn("[tracker] falha ao registrar evento", payload?.tipo_evento, err?.message || err);
    });
  } catch (err) {
    console.warn("[tracker] erro ao enviar evento", payload?.tipo_evento, err?.message || err);
  }
  // Reaproveita analytics nativa da plataforma (fire-and-forget).
  try {
    base44.analytics.track({
      eventName: payload.tipo_evento === "visita" ? "page_view" : "cta_click",
      properties: {
        destino: payload.destino || "",
        origem: payload.origem_botao || "",
        pagina: payload.pagina || "",
        dispositivo: payload.dispositivo || "",
        utm_source: payload.utm_source || "",
        utm_medium: payload.utm_medium || "",
        utm_campaign: payload.utm_campaign || "",
        canal: payload.canal || "",
      },
    });
  } catch {}
}

export function trackVisit(pagina = "/") {
  try {
    const visits = JSON.parse(sessionStorage.getItem(VISIT_KEY) || "[]");
    if (visits.includes(pagina)) return;
    visits.push(pagina);
    sessionStorage.setItem(VISIT_KEY, JSON.stringify(visits));
  } catch {}
  const utms = getUtms();
  send({
    tipo_evento: "visita",
    pagina,
    referrer: (typeof document !== "undefined" && document.referrer) || "",
    utm_source: utms.utm_source,
    utm_medium: utms.utm_medium,
    utm_campaign: utms.utm_campaign,
    gclid: utms.gclid,
    dispositivo: getDevice(),
    sessao_id: getSessionId(),
  });
}

function dedupeClick(key) {
  try {
    const now = Date.now();
    const clicks = JSON.parse(sessionStorage.getItem(CLICK_KEY) || "{}");
    if (now - (clicks[key] || 0) < 2000) return false; // ignora duplo disparo
    clicks[key] = now;
    sessionStorage.setItem(CLICK_KEY, JSON.stringify(clicks));
  } catch {}
  return true;
}

export function trackCta(destination, location) {
  if (!dedupeClick(`${destination}:${location}`)) return;
  const utms = getUtms();
  send({
    tipo_evento: "clique",
    destino: destination,
    origem_botao: location,
    pagina: (typeof window !== "undefined" && window.location.pathname) || "/",
    referrer: (typeof document !== "undefined" && document.referrer) || "",
    utm_source: utms.utm_source,
    utm_medium: utms.utm_medium,
    utm_campaign: utms.utm_campaign,
    gclid: utms.gclid,
    dispositivo: getDevice(),
    sessao_id: getSessionId(),
  });
}

export function trackSocial(network, location) {
  trackCta(String(network || "").toLowerCase(), location);
}

// Abertura do Consultor Neyzito — 1 por sessão (dedup no cliente e no servidor).
// Registra apenas o fato da abertura, sem conteúdo da conversa.
export function trackChatOpen() {
  try {
    if (sessionStorage.getItem("neyzito_chat_open")) return;
    sessionStorage.setItem("neyzito_chat_open", "1");
  } catch {}
  const utms = getUtms();
  send({
    tipo_evento: "chat_aberto",
    destino: "chat",
    origem_botao: "consultor",
    pagina: (typeof window !== "undefined" && window.location.pathname) || "/",
    referrer: (typeof document !== "undefined" && document.referrer) || "",
    utm_source: utms.utm_source,
    utm_medium: utms.utm_medium,
    utm_campaign: utms.utm_campaign,
    gclid: utms.gclid,
    dispositivo: getDevice(),
    sessao_id: getSessionId(),
  });
}

// Interação no chat (mensagem enviada) — dedup de 2s. Sem armazenar conteúdo.
export function trackChatInteraction() {
  if (!dedupeClick("chat_interacao")) return;
  const utms = getUtms();
  send({
    tipo_evento: "chat_interacao",
    destino: "chat",
    origem_botao: "consultor",
    pagina: (typeof window !== "undefined" && window.location.pathname) || "/",
    referrer: (typeof document !== "undefined" && document.referrer) || "",
    utm_source: utms.utm_source,
    utm_medium: utms.utm_medium,
    utm_campaign: utms.utm_campaign,
    gclid: utms.gclid,
    dispositivo: getDevice(),
    sessao_id: getSessionId(),
  });
}

// --- Navegação interna e profundidade de leitura -------------------------
// Complementa o rastreamento de visitas/cliques: registra quais seções da
// página foram vistas (âncoras) e quanto da página o visitante rolou. Usam
// tipos de evento próprios ("secao_vista" e "scroll_profundidade") para NÃO
// inflar a métrica de visitas do painel, e são deduplicados por sessão
// (1 disparo por seção / por marco de scroll).

const SECTION_KEY = "neyzito_sections";
const SCROLL_KEY = "neyzito_scroll";

// Seções monitoradas na landing page (mesmos ids das âncoras do Navbar).
export const TRACKED_SECTIONS = [
  { id: "top", label: "Hero" },
  { id: "beneficios", label: "Benefícios" },
  { id: "ambiente", label: "Ambiente" },
  { id: "servicos", label: "Serviços" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "avaliacoes", label: "Avaliações" },
  { id: "contato", label: "Contato" },
];

function alreadySent(storageKey, value) {
  try {
    const seen = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
    if (seen.includes(value)) return true;
    seen.push(value);
    sessionStorage.setItem(storageKey, JSON.stringify(seen));
  } catch {}
  return false;
}

// Registra que uma seção entrou na tela. `pagina` vira "/#<id>" e o rótulo da
// seção vai em `origem_botao`, para o painel de Métricas mostrar a navegação
// sem poluir a contagem de visitas por rota.
export function trackSectionView(sectionId, label) {
  if (!sectionId) return;
  if (alreadySent(SECTION_KEY, sectionId)) return;
  const utms = getUtms();
  send({
    tipo_evento: "secao_vista",
    pagina: `/#${sectionId}`,
    origem_botao: label || sectionId,
    utm_source: utms.utm_source,
    utm_medium: utms.utm_medium,
    utm_campaign: utms.utm_campaign,
    gclid: utms.gclid,
    dispositivo: getDevice(),
    sessao_id: getSessionId(),
  });
}

// Registra marcos de profundidade de scroll (25/50/75/100%), 1x por sessão.
export function trackScrollDepth(percent) {
  const marco = `${percent}%`;
  if (alreadySent(SCROLL_KEY, marco)) return;
  const utms = getUtms();
  send({
    tipo_evento: "scroll_profundidade",
    pagina: "/#scroll",
    origem_botao: marco,
    utm_source: utms.utm_source,
    utm_medium: utms.utm_medium,
    utm_campaign: utms.utm_campaign,
    gclid: utms.gclid,
    dispositivo: getDevice(),
    sessao_id: getSessionId(),
  });
}

// Ativa o observador de seções e de scroll. Retorna uma função de limpeza.
// Usa IntersectionObserver (seções) e listener de scroll com throttle (marcos).
export function startNavigationTracking() {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const found = TRACKED_SECTIONS.find((s) => s.id === entry.target.id);
        if (found) trackSectionView(found.id, found.label);
      });
    },
    { threshold: 0.5 }
  );

  TRACKED_SECTIONS.forEach((s) => {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  });

  const marcos = [25, 50, 75, 100];
  const disparados = new Set();
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      const doc = document.documentElement;
      const altura = doc.scrollHeight - window.innerHeight;
      if (altura <= 0) return;
      const pct = Math.min(100, Math.round((window.scrollY / altura) * 100));
      marcos.forEach((m) => {
        if (pct >= m && !disparados.has(m)) {
          disparados.add(m);
          trackScrollDepth(m);
        }
      });
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", onScroll);
  };
}