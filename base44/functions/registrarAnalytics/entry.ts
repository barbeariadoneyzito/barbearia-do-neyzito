import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Captura pública de eventos de analytics na landing page (visitas, cliques,
// abertura/interação no chat). Função deliberadamente pública (visitante anônimo):
// valida e limita os campos, classifica o canal de aquisição a partir de
// referrer/UTM/gclid, deduplica visitas e aberturas de chat por sessão, e grava
// via service role. A entidade AnalyticsEvent tem create restrito a admin, então
// só esta função grava. Não armazena conteúdo das conversas — apenas o fato de
// que houve abertura/interação.
const ALLOWED_TIPOS = ["visita", "clique", "chat_aberto", "chat_interacao", "secao_vista", "scroll_profundidade"];
const ALLOWED_DESTINOS = ["appbarber", "whatsapp", "instagram", "tiktok", "youtube", "google", "maps", "chat"];
const ALLOWED_DEVICES = ["mobile", "desktop", "tablet", "outro"];

// Plataformas de IA — adicionar novas plataformas aqui (extensível).
// Classificação só acontece com evidência (referrer ou UTM); acesso direto nunca vira IA.
const AI_PLATFORMS = [
  { match: /chatgpt|chat\.openai|openai\.com/, label: "IA — ChatGPT" },
  { match: /gemini|bard\.google|google\.com\/gemini/, label: "IA — Gemini" },
  { match: /perplexity/, label: "IA — Perplexity" },
  { match: /claude\.ai|anthropic/, label: "IA — Claude" },
  { match: /copilot|microsoft\.com\/copilot|bing\.com.*copilot/, label: "IA — Copilot" },
  { match: /you\.com/, label: "IA — You.com" },
  { match: /poe\.com/, label: "IA — Poe" },
  { match: /meta\.ai/, label: "IA — Meta AI" },
  { match: /grok/, label: "IA — Grok" },
  { match: /deepseek/, label: "IA — DeepSeek" },
  { match: /mistral/, label: "IA — Mistral" },
];

function clean(v, max) {
  if (v == null) return "";
  return String(v).slice(0, max);
}

// Classifica o canal de aquisição. Sem evidência suficiente -> "Acesso direto"
// (nenhum referrer/UTM) ou "Origem desconhecida" (há evidência, mas não
// reconhecida). Nunca inferir IA sem evidência.
function classificarCanal({ referrer, utm_source, utm_medium, utm_campaign, gclid }) {
  const ref = (referrer || "").toLowerCase();
  const src = (utm_source || "").toLowerCase();
  const med = (utm_medium || "").toLowerCase();
  const camp = (utm_campaign || "").toLowerCase();

  if (gclid) return "Google Ads";
  if ((src === "google" || src === "google_ads" || src === "adwords") && /cpc|ppc|paid/.test(med)) {
    return "Google Ads";
  }

  for (const a of AI_PLATFORMS) {
    if (a.match.test(src) || a.match.test(ref) || a.match.test(camp)) return a.label;
  }

  if (/maps\.google|google\.[a-z.]+\/maps|google\.com\/local|business\.google|local\.google|g\.page/.test(ref)) {
    return "Google Meu Negócio";
  }
  if (src === "maps" || src === "google_maps" || src === "gbp" || src === "google_business" || src === "google_meu_negocio" || src === "google_my_business" || src === "gmb") {
    return "Google Meu Negócio";
  }
  if (src === "google" && /maps|local|business|gbp|perfil/.test(camp)) return "Google Meu Negócio";

  if (/google\.[a-z.]+\/(search|url|webhp)/.test(ref) && !/maps/.test(ref)) return "Google Pesquisa";
  if (src === "google" && !/cpc|ppc|paid/.test(med)) return "Google Pesquisa";

  if (src === "instagram" || /instagram\.com/.test(ref)) return "Instagram";
  if (src === "facebook" || /facebook\.com/.test(ref)) return "Facebook";
  if (src === "tiktok" || /tiktok\.com/.test(ref)) return "TikTok";
  if (src === "youtube" || /youtube\.com|youtu\.be/.test(ref)) return "YouTube";
  if (src === "linkedin" || /linkedin\.com/.test(ref)) return "LinkedIn";

  if (src === "whatsapp" || /whatsapp\.com|wa\.me/.test(ref)) return "WhatsApp";
  if (src === "appbarber" || /appbarber/.test(ref)) return "AppBarber";
  if (src === "indicacao" || src === "referral") return "Indicação";

  if (!ref && !src && !med && !camp) return "Acesso direto";
  return "Origem desconhecida";
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try {
      body = await req.json();
    } catch {
      return Response.json({ ok: false, error: "invalid body" }, { status: 400 });
    }

    const tipo = clean(body.tipo_evento, 24);
    if (!ALLOWED_TIPOS.includes(tipo)) {
      return Response.json({ ok: false, error: "tipo_evento invalido" }, { status: 400 });
    }
    const sessao_id = clean(body.sessao_id, 64).trim();
    if (sessao_id.length < 8 || sessao_id.length > 64) {
      return Response.json({ ok: false, error: "sessao invalida" }, { status: 400 });
    }

    const dispositivo = ALLOWED_DEVICES.includes(body.dispositivo) ? body.dispositivo : "outro";
    const pagina = clean(body.pagina, 120) || "/";
    const referrer = clean(body.referrer, 300);
    const utm_source = clean(body.utm_source, 120);
    const utm_medium = clean(body.utm_medium, 120);
    const utm_campaign = clean(body.utm_campaign, 120);
    const gclid = clean(body.gclid, 200);
    const canal = classificarCanal({ referrer, utm_source, utm_medium, utm_campaign, gclid });

    const shared = { pagina, referrer, utm_source, utm_medium, utm_campaign, dispositivo, sessao_id, canal, gclid };

    if (tipo === "visita") {
      // 1 visita por sessão por página
      const existing = await base44.asServiceRole.entities.AnalyticsEvent.filter(
        { tipo_evento: "visita", sessao_id, pagina },
        { limit: 1, fields: ["id"] }
      );
      if ((existing.items || []).length > 0) return Response.json({ ok: true, dedup: true });
      await base44.asServiceRole.entities.AnalyticsEvent.create({
        tipo_evento: "visita", destino: "", origem_botao: "", ...shared
      });
      return Response.json({ ok: true });
    }

    if (tipo === "chat_aberto") {
      // 1 abertura do chat por sessão
      const existing = await base44.asServiceRole.entities.AnalyticsEvent.filter(
        { tipo_evento: "chat_aberto", sessao_id },
        { limit: 1, fields: ["id"] }
      );
      if ((existing.items || []).length > 0) return Response.json({ ok: true, dedup: true });
      await base44.asServiceRole.entities.AnalyticsEvent.create({
        tipo_evento: "chat_aberto", destino: "chat", origem_botao: "consultor", ...shared
      });
      return Response.json({ ok: true });
    }

    if (tipo === "chat_interacao") {
      // Cada mensagem enviada = 1 interação (dedup de 2s no cliente)
      await base44.asServiceRole.entities.AnalyticsEvent.create({
        tipo_evento: "chat_interacao", destino: "chat", origem_botao: "consultor", ...shared
      });
      return Response.json({ ok: true });
    }

    if (tipo === "secao_vista" || tipo === "scroll_profundidade") {
      // Navegação interna: 1 disparo por seção / por marco de scroll (dedup no
      // cliente). O rótulo (nome da seção ou "25%"/"50%"...) vai em origem_botao.
      // Não conta como visita — por isso tipo_evento próprio.
      const existing = await base44.asServiceRole.entities.AnalyticsEvent.filter(
        { tipo_evento: tipo, sessao_id, pagina, origem_botao: clean(body.origem_botao, 40) },
        { limit: 1, fields: ["id"] }
      );
      if ((existing.items || []).length > 0) return Response.json({ ok: true, dedup: true });
      await base44.asServiceRole.entities.AnalyticsEvent.create({
        tipo_evento: tipo,
        destino: "",
        origem_botao: clean(body.origem_botao, 40),
        ...shared,
      });
      return Response.json({ ok: true });
    }

    // clique
    const destino = clean(body.destino, 40);
    if (!ALLOWED_DESTINOS.includes(destino)) {
      return Response.json({ ok: false, error: "destino invalido" }, { status: 400 });
    }
    const origem_botao = clean(body.origem_botao, 40);
    await base44.asServiceRole.entities.AnalyticsEvent.create({
      tipo_evento: "clique", destino, origem_botao, ...shared
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}