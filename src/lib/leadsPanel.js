import { spDateKey, parseDbDate } from "@/lib/timezone";

export const STATUS_OPTIONS = [
  { value: "novo", label: "Novo", badge: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { value: "Redirecionado para AppBarber", label: "Redirecionado p/ AppBarber", badge: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  { value: "contatado", label: "Contatado", badge: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { value: "agendou", label: "Agendou", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { value: "compareceu", label: "Compareceu", badge: "bg-green-700/20 text-green-300 border-green-700/40" },
  { value: "nao_convertido", label: "Não convertido", badge: "bg-red-500/15 text-red-300 border-red-500/30" },
];

export const statusLabel = (v) => STATUS_OPTIONS.find((s) => s.value === v)?.label || v || "—";

export const statusBadge = (v) =>
  STATUS_OPTIONS.find((s) => s.value === v)?.badge || "bg-white/10 text-slate-300 border-white/20";

export const TIPO_CLIENTE_OPTIONS = [
  { value: "Não identificado", label: "Não identificado", badge: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  { value: "Cliente novo", label: "Cliente novo", badge: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { value: "Já é cliente", label: "Já é cliente", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
];

export const tipoClienteLabel = (v) => TIPO_CLIENTE_OPTIONS.find((t) => t.value === v)?.label || v || "Não identificado";

export const tipoClienteBadge = (v) =>
  TIPO_CLIENTE_OPTIONS.find((t) => t.value === v)?.badge || "bg-slate-500/15 text-slate-300 border-slate-500/30";

// Lista padronizada de origens de aquisição
export const ORIGEM_OPTIONS = [
  { value: "Não identificado", label: "Não identificado", badge: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  { value: "Google Pesquisa", label: "Google Pesquisa", badge: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { value: "Google Meu Negócio", label: "Google Meu Negócio", badge: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { value: "Instagram", label: "Instagram", badge: "bg-pink-500/15 text-pink-300 border-pink-500/30" },
  { value: "Facebook", label: "Facebook", badge: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { value: "TikTok", label: "TikTok", badge: "bg-slate-500/15 text-slate-200 border-slate-500/30" },
  { value: "LinkedIn", label: "LinkedIn", badge: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { value: "WhatsApp Business", label: "WhatsApp Business", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { value: "AppBarber", label: "AppBarber", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { value: "Plataforma de IA", label: "Plataforma de IA", badge: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { value: "Indicação de cliente", label: "Indicação de cliente", badge: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { value: "Acesso direto", label: "Acesso direto", badge: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  { value: "Outro", label: "Outro", badge: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
];

export const origemLabel = (v) => ORIGEM_OPTIONS.find((o) => o.value === v)?.label || v || "Não identificado";

export const origemBadge = (v) =>
  ORIGEM_OPTIONS.find((o) => o.value === v)?.badge || "bg-slate-500/15 text-slate-300 border-slate-500/30";

// Normaliza origens legadas/não padronizadas para o valor padrão
export function normalizeOrigem(v) {
  if (!v) return "Não identificado";
  return ORIGEM_OPTIONS.some((o) => o.value === v) ? v : "Não identificado";
}

export const SITUACAO_OPTIONS = [
  { value: "pendente", label: "Pendente", badge: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { value: "confirmado", label: "Confirmado", badge: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { value: "compareceu", label: "Compareceu", badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { value: "faltou", label: "Faltou", badge: "bg-red-500/15 text-red-300 border-red-500/30" },
  { value: "cancelado", label: "Cancelado", badge: "bg-red-500/15 text-red-300 border-red-500/30" },
  { value: "reagendado", label: "Reagendado", badge: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
];

export const situacaoLabel = (v) => SITUACAO_OPTIONS.find((s) => s.value === v)?.label || "—";

export const situacaoBadge = (v) =>
  SITUACAO_OPTIONS.find((s) => s.value === v)?.badge || "bg-white/10 text-slate-300 border-white/20";

export const PREFERENCIA_CONTATO_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telefone", label: "Telefone" },
  { value: "email", label: "E-mail" },
];

export function normalizePhone(raw) {
  if (!raw) return "";
  return String(raw).replace(/\D/g, "");
}

export function getDuplicatePhones(leads) {
  const counts = {};
  leads.forEach((l) => {
    const p = normalizePhone(l.whatsapp);
    if (!p) return;
    counts[p] = (counts[p] || 0) + 1;
  });
  return new Set(Object.keys(counts).filter((p) => counts[p] > 1));
}

export function formatDateOnly(v) {
  if (!v) return "—";
  const s = String(v);
  // Valor com horário (ISO datetime): converte para a data no fuso de Brasília,
  // evitando pegar o dia UTC (que pode diferir do dia de Brasília à noite).
  if (s.includes("T")) {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(parseDbDate(s));
    } catch {
      return s;
    }
  }
  const [y, m, d] = s.slice(0, 10).split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

export function formatSpDate(iso) {
  if (!iso) return "—";
  try {
    const d = parseDbDate(iso);
    const data = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
    const hora = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
    return `${data} ${hora}`;
  } catch {
    return String(iso);
  }
}

export function formatBRL(v) {
  if (v == null || v === "" || isNaN(Number(v))) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

export function whatsappLink(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : "55" + digits;
  return `https://wa.me/${withCountry}`;
}

export function exportLeadsCSV(leads) {
  const headers = [
    "ID_Registro",
    "Data_Hora_Contato",
    "Nome_Cliente",
    "Telefone",
    "Email",
    "Servico",
    "Barbeiro",
    "Canal_Origem",
    "Meio_Acesso",
    "Referrer",
    "Status_Agendamento",
    "Valor_Servico",
  ];
  const rows = leads.map((l) => [
    l.id || "",
    formatSpDate(l.created_date),
    l.nome || "",
    l.whatsapp || "",
    l.email || "",
    l.servico_interesse || "",
    l.barbeiro_preferido || "",
    origemLabel(normalizeOrigem(l.origem)),
    l.canal || "",
    l.referrer || "",
    statusLabel(l.status),
    l.preco_servico != null && l.preco_servico !== "" ? formatBRL(l.preco_servico) : "",
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
  a.download = `leads-barbearia-neyzito-${spDateKey(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}