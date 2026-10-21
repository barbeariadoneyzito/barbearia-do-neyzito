import { formatSpDate } from "@/lib/leadsPanel";
import { spStartOfDay, spEndOfDay, spDateKey } from "@/lib/timezone";

export const DESTINO_LABELS = {
  appbarber: "AppBarber",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  google: "Google",
  maps: "Mapas",
  chat: "Chat",
};
export const destinoLabel = (v) => DESTINO_LABELS[v] || v || "—";

export const ACAO_OPTIONS = [
  { value: "visita", label: "Visita à página" },
  { value: "clique", label: "Clique" },
  { value: "chat_aberto", label: "Abriu o chat" },
  { value: "chat_interacao", label: "Interagiu no chat" },
];

export const DESTINO_OPTIONS = [
  { value: "appbarber", label: "AppBarber" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "chat", label: "Chat" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "google", label: "Google" },
  { value: "maps", label: "Mapas" },
];

export const DEVICE_LABELS = {
  mobile: "Celular",
  desktop: "Computador",
  tablet: "Tablet",
  outro: "Outro",
};
export const deviceLabel = (v) => DEVICE_LABELS[v] || v || "—";

// Canais classificados no backend (registrarAnalytics). Novos canais/plataformas
// aparecem automaticamente no painel via aggregate groupBy canal — adicionar à
// lista de IA na função basta; este mapa só dá rótulos amigáveis.
export const CANAL_LABELS = {
  "Google Ads": "Google Ads",
  "Google Business Profile": "Google Meu Negócio",
  "Google Meu Negócio": "Google Meu Negócio",
  "Google Pesquisa": "Google Pesquisa",
  Instagram: "Instagram",
  Facebook: "Facebook",
  TikTok: "TikTok",
  YouTube: "YouTube",
  LinkedIn: "LinkedIn",
  WhatsApp: "WhatsApp",
  AppBarber: "AppBarber",
  Indicação: "Indicação",
  "Acesso direto": "Acesso direto",
  "Origem desconhecida": "Origem desconhecida",
};
export const canalLabel = (v) => (v ? CANAL_LABELS[v] || v : "Não classificado");

// Canais sociais cobertos pela seção "Redes Sociais" do painel.
export const SOCIAL_CHANNELS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Facebook", "WhatsApp"];
export const SOCIAL_DESTINOS = ["instagram", "tiktok", "youtube", "linkedin", "facebook", "whatsapp"];

export const isCanalIA = (v) => typeof v === "string" && v.startsWith("IA —");

// Opções do filtro de canal. "__ia__" = todas as plataformas de IA (regex no backend).
export const CANAL_OPTIONS = [
  { value: "", label: "Todos os canais" },
  { value: "__ia__", label: "IA (todas)" },
  { value: "IA — ChatGPT", label: "IA — ChatGPT" },
  { value: "IA — Gemini", label: "IA — Gemini" },
  { value: "IA — Perplexity", label: "IA — Perplexity" },
  { value: "IA — Claude", label: "IA — Claude" },
  { value: "Google Ads", label: "Google Ads" },
  { value: "Google Business Profile", label: "Google Meu Negócio" },
  { value: "Google Pesquisa", label: "Google Pesquisa" },
  { value: "Instagram", label: "Instagram" },
  { value: "Facebook", label: "Facebook" },
  { value: "TikTok", label: "TikTok" },
  { value: "YouTube", label: "YouTube" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "AppBarber", label: "AppBarber" },
  { value: "Indicação", label: "Indicação" },
  { value: "Acesso direto", label: "Acesso direto" },
  { value: "Origem desconhecida", label: "Origem desconhecida" },
];

// Limites dos dias no fuso de Brasília (America/Sao_Paulo), convertidos para UTC
// na consulta. Antes usava o fuso do navegador, o que deslocava o início/fim do
// dia em até 3h e incluía/excluía eventos indevidamente.
export function rangeQuery(range, customFrom, customTo) {
  const now = new Date();
  let from;
  let to;
  if (range === "hoje") {
    from = spStartOfDay(now);
    to = spEndOfDay(now);
  } else if (range === "7d") {
    from = spStartOfDay(new Date(now.getTime() - 6 * 86400000));
    to = spEndOfDay(now);
  } else if (range === "30d") {
    from = spStartOfDay(new Date(now.getTime() - 29 * 86400000));
    to = spEndOfDay(now);
  } else {
    from = customFrom ? new Date(customFrom + "T00:00:00-03:00") : new Date(0);
    to = customTo ? new Date(customTo + "T23:59:59.999-03:00") : now;
  }
  return { created_date: { $gte: from.toISOString(), $lt: to.toISOString() } };
}

// Intervalo de um mês inteiro (YYYY-MM) no fuso de Brasília. Início = dia 1
// 00:00 -03:00; fim = dia 1 do mês seguinte 00:00 -03:00 (exclusivo). Usado pelo
// relatório mensal consolidado por barbeiro (filtra Leads por created_date).
export function monthRangeQuery(mes) {
  const [y, m] = mes.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1, 3, 0, 0));
  const to = new Date(Date.UTC(y, m, 1, 3, 0, 0));
  return { created_date: { $gte: from.toISOString(), $lt: to.toISOString() } };
}

export function exportEventosCSV(eventos) {
  const headers = [
    "Data/hora",
    "Tipo",
    "Canal",
    "Destino",
    "Origem do botão",
    "Página",
    "Dispositivo",
    "UTM source",
    "UTM medium",
    "UTM campaign",
    "gclid",
    "Referrer",
    "Sessão",
  ];
  const rows = eventos.map((e) => [
    formatSpDate(e.created_date),
    e.tipo_evento === "visita" ? "Visita" : "Clique",
    e.canal || "",
    e.tipo_evento === "clique" ? destinoLabel(e.destino) : "",
    e.origem_botao || "",
    e.pagina || "",
    deviceLabel(e.dispositivo),
    e.utm_source || "",
    e.utm_medium || "",
    e.utm_campaign || "",
    e.gclid || "",
    e.referrer || "",
    e.sessao_id || "",
  ]);
  const escape = (v) => {
    const s = String(v ?? "");
    if (s.includes(";") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `metricas-neyzito-${spDateKey(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}