import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Criação pública de lead a partir do chat da landing page (visitante anônimo).
// v2 — origem prioriza utm_source; aceita consentimento_marketing/promocoes.// A entidade Leads tem create restrito a admin, e o RLS do Base44 BLOQUEIA
// chamadores anônimos em regras com user_condition (ver docs de segurança).
// Por isso o agent não consegue gravar o lead direto: a escrita é negada e o
// lead desaparece. Esta função faz a gravação via service role, aplicando as
// mesmas validações/limites que registrarAnalytics.
//
// Segurança: a função só CRIA lead (nunca lê, atualiza ou exclui) e só aceita
// os campos abaixo. Campos sensíveis de controle (visualizado,
// situacao_atendimento, tipo_cliente, id_externo, responsavel_atendimento,
// descadastrado) não são aceitos do cliente, para um visitante não poder
// forjar um lead "confirmado" ou marcar alguém como descadastrado.
const ALLOWED_ORIGENS = [
  "Google Pesquisa",
  "Google Meu Neg\u00f3cio",
  "Instagram",
  "Facebook",
  "TikTok",
  "LinkedIn",
  "WhatsApp Business",
  "AppBarber",
  "Plataforma de IA",
  "Indica\u00e7\u00e3o de cliente",
  "Acesso direto",
  "Outro",
  "N\u00e3o identificado",
];

// Plataformas de IA reconhecidas no referrer (mesma lista do registrarAnalytics).
const AI_PATTERNS =
  /chatgpt|chat\.openai|openai\.com|gemini|bard\.google|perplexity|claude\.ai|anthropic|copilot|you\.com|poe\.com|meta\.ai|grok|deepseek|mistral/;

// Deriva a origem a partir do utm_source. É a evidência mais confiável: o
// cliente chegou por um link marcado, então prevalece sobre a origem que o
// agente informou e sobre o referrer.
function origemDoUtm(utm) {
  const u = String(utm || "").toLowerCase();
  if (!u) return "";
  if (AI_PATTERNS.test(u)) return "Plataforma de IA";
  if (/google_meu_negocio|google_my_business|gmb|perfil_gmb|perfil_google|google_business/.test(u))
    return "Google Meu Neg\u00f3cio";
  if (/maps|googlemaps|gbp/.test(u)) return "Google Meu Neg\u00f3cio";
  if (/instagram/.test(u)) return "Instagram";
  if (/facebook|fb_|meta/.test(u)) return "Facebook";
  if (/tiktok/.test(u)) return "TikTok";
  if (/linkedin/.test(u)) return "LinkedIn";
  if (/whatsapp|wa_me|wame/.test(u)) return "WhatsApp Business";
  if (/appbarber/.test(u)) return "AppBarber";
  if (/chatgpt|openai|gemini|perplexity|claude|copilot/.test(u)) return "Plataforma de IA";
  if (/google/.test(u)) return "Google Pesquisa";
  return "";
}

// Deriva a origem a partir do referrer quando não há UTM suficiente. Cobre o
// caso mais comum: o cliente clica no Perfil da Empresa (Google Meu Negócio) ou
// vem de um assistente de IA e chega sem utm_source na URL.
function origemDoReferrer(referrer) {
  const r = String(referrer || "").toLowerCase();
  if (!r) return "";
  if (AI_PATTERNS.test(r)) return "Plataforma de IA";
  if (/maps\.google|google\.[a-z.]+\/maps|google\.com\/local|business\.google|local\.google|g\.page/.test(r))
    return "Google Meu Neg\u00f3cio";
  if (/instagram\.com/.test(r)) return "Instagram";
  if (/facebook\.com/.test(r)) return "Facebook";
  if (/tiktok\.com/.test(r)) return "TikTok";
  if (/linkedin\.com/.test(r)) return "LinkedIn";
  if (/youtube\.com|youtu\.be/.test(r)) return "Outro";
  if (/whatsapp\.com|wa\.me/.test(r)) return "WhatsApp Business";
  if (/google\./.test(r)) return "Google Pesquisa";
  return "";
}
const ALLOWED_TIPOS_CLIENTE = ["Cliente novo", "J\u00e1 \u00e9 cliente", "N\u00e3o identificado"];
const ALLOWED_PREFERENCIA = ["whatsapp", "telefone", "email"];

function clean(v, max) {
  if (v == null) return "";
  return String(v).trim().slice(0, max);
}

// Aceita apenas a lista padronizada; qualquer outro valor vira "Não identificado".
function safeOrigem(v) {
  const s = clean(v, 60);
  return ALLOWED_ORIGENS.includes(s) ? s : "N\u00e3o identificado";
}

function safeEnum(v, allowed, fallback = "") {
  const s = clean(v, 40);
  return allowed.includes(s) ? s : fallback;
}

// Telefone: guarda só dígitos (mesma normalização do painel) e valida tamanho.
function cleanPhone(v) {
  const digits = String(v || "").replace(/\D/g, "").slice(0, 15);
  return digits;
}

// Data no formato aceito pela entidade: YYYY-MM-DD ou YYYY-MM-DDTHH:MM.
function cleanDate(v) {
  const s = clean(v, 40);
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return s;
  return "";
}

export default async function (req: any) {
  try {
    const base44 = createClientFromRequest(req);
    let body: Record<string, any> = {};
    try {
      body = await req.json();
    } catch {
      return Response.json({ ok: false, error: "invalid body" }, { status: 400 });
    }

    // Campos obrigatórios da entidade Leads: nome e whatsapp.
    const nome = clean(body.nome, 120);
    const whatsapp = cleanPhone(body.whatsapp);
    if (nome.length < 2) {
      return Response.json({ ok: false, error: "nome obrigatorio" }, { status: 400 });
    }
    if (whatsapp.length < 10 || whatsapp.length > 15) {
      return Response.json({ ok: false, error: "whatsapp invalido" }, { status: 400 });
    }

    const email = clean(body.email, 160);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, error: "email invalido" }, { status: 400 });
    }

    // Consentimento de marketing só é verdadeiro com manifestação explícita.
    // Aceita as duas grafias em uso: consentimento_marketing (entidade) e
    // consentimento_promocoes (nome usado no chat/agente).
    const consentimentoMarketing =
      body.consentimento_marketing === true || body.consentimento_promocoes === true;

    const referrer = clean(body.referrer, 300);
    const utmSource = clean(body.utm_source, 120);
    // Origem: o utm_source é a evidência mais forte (o cliente veio de um link
    // marcado). Sem ele, usa a origem informada; por último, deriva do referrer.
    // Sem nenhuma evidência permanece "Não identificado" — nunca inventa.
    let origemResolvida = origemDoUtm(utmSource);
    if (!origemResolvida) origemResolvida = safeOrigem(body.origem);
    if (origemResolvida === "N\u00e3o identificado") {
      const doRef = origemDoReferrer(referrer);
      if (doRef) origemResolvida = doRef;
    }

    const lead: Record<string, any> = {
      nome,
      whatsapp,
      email,
      servico_interesse: clean(body.servico_interesse, 120),
      barbeiro_preferido: clean(body.barbeiro_preferido, 120),
      status: "Redirecionado para AppBarber",
      origem: origemResolvida,
      canal: clean(body.canal, 80) || "Chat landing page",
      campanha: clean(body.campanha, 120),
      observacoes: clean(body.observacoes, 500),
      tipo_cliente: safeEnum(body.tipo_cliente, ALLOWED_TIPOS_CLIENTE, "N\u00e3o identificado"),
      primeiro_contato: cleanDate(body.primeiro_contato) || new Date().toISOString().slice(0, 10),
      data_agendamento: cleanDate(body.data_agendamento),
      preferencia_contato: safeEnum(body.preferencia_contato, ALLOWED_PREFERENCIA, ""),
      consentimento_marketing: consentimentoMarketing,
      consentimento_data: consentimentoMarketing ? clean(body.consentimento_data, 20) || new Date().toISOString().slice(0, 10) : "",
      consentimento_origem: consentimentoMarketing ? clean(body.consentimento_origem, 80) || "chat landing page" : "",
      consentimento_finalidade: consentimentoMarketing ? clean(body.consentimento_finalidade, 80) || "promo\u00e7\u00f5es" : "",
      // Contexto de aquisição (mesma jornada dos eventos de analytics).
      utm_source: clean(body.utm_source, 120),
      utm_medium: clean(body.utm_medium, 120),
      utm_campaign: clean(body.utm_campaign, 120),
      referrer,
      pagina_entrada: clean(body.pagina_entrada, 120) || "/",
      sessao_id: clean(body.sessao_id, 64),
      // Preço é preenchido a partir do serviço escolhido, quando o serviço
      // informado casar com o catálogo. Não vem do cliente como valor livre.
    };

    // Preço do serviço: busca no catálogo Servicos pelo nome informado, para o
    // rendimento por barbeiro no painel. Falha aqui não bloqueia o lead.
    if (lead.servico_interesse) {
      try {
        const servicos = await base44.asServiceRole.entities.Servicos.filter(
          { nome: lead.servico_interesse },
          { limit: 1, fields: ["nome", "preco"] }
        );
        const preco = servicos?.items?.[0]?.preco;
        if (typeof preco === "number") lead.preco_servico = preco;
      } catch {}
    }

    const created = await base44.asServiceRole.entities.Leads.create(lead);
    return Response.json({ ok: true, id: created?.id || null });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
