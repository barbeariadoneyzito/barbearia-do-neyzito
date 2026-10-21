// Lista de clientes para remarketing.
//
// Consolida os leads em UMA linha por pessoa (telefone normalizado quando
// houver, senão o e-mail), com:
//   - dados de contato (nome, telefone, e-mail, preferência de contato)
//   - consentimento de marketing (base legal para enviar campanha)
//   - última visita (mais recente atendimento "compareceu") e dias sem vir
//   - recorrência (quantos atendimentos confirmados a pessoa já teve)
//   - serviços/barbeiros de preferência e origem
//
// "Cliente válido para remarketing" = tem contato (telefone OU e-mail) E
// consentimento de marketing, e não está descadastrado. Mesma regra usada no
// restante do painel para o rendimento: só "compareceu" conta como visita.
import { normalizePhone, normalizeOrigem } from "@/lib/leadsPanel";
import { parseDbDate } from "@/lib/timezone";

// Dias inteiros entre a data e agora (Brasília), com base na data-calendário.
export function diasDesde(dataIso) {
  if (!dataIso) return null;
  try {
    const d = parseDbDate(dataIso);
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / 86400000);
  } catch {
    return null;
  }
}

export function ultimoTimestamp(iso) {
  if (!iso) return 0;
  try {
    return parseDbDate(iso).getTime() || 0;
  } catch {
    return 0;
  }
}

// Chave de agrupamento: telefone normalizado; se não houver, o e-mail em
// minúsculas; se não houver nenhum, cai no id (a pessoa fica sozinha).
function chaveCliente(l) {
  const tel = normalizePhone(l.whatsapp);
  if (tel) return "tel:" + tel;
  const email = (l.email || "").trim().toLowerCase();
  if (email) return "email:" + email;
  return "id:" + (l.id || Math.random().toString(36).slice(2));
}

// Consolida a lista de leads em clientes únicos.
export function consolidarClientes(leads) {
  const mapa = new Map();

  for (const l of leads || []) {
    const key = chaveCliente(l);
    if (!mapa.has(key)) {
      mapa.set(key, {
        key,
        nome: l.nome || "",
        whatsapp: l.whatsapp || "",
        email: l.email || "",
        preferencia_contato: l.preferencia_contato || "",
        consentimento_marketing: false,
        descadastrado: false,
        origem: normalizeOrigem(l.origem),
        ultima_visita: null,
        ultima_visita_ts: 0,
        ultimo_contato: l.created_date || null,
        ultimo_contato_ts: ultimoTimestamp(l.created_date),
        atendimentos: 0,
        faltas: 0,
        cancelamentos: 0,
        total_agendado: 0,
        total_gasto: 0,
        servicos: new Set(),
        barbeiros: new Set(),
        leads: 0,
      });
    }
    const c = mapa.get(key);
    c.leads++;

    // Contato: preserva o mais recente preenchido.
    if (l.nome && !c.nome) c.nome = l.nome;
    if (l.whatsapp && !c.whatsapp) c.whatsapp = l.whatsapp;
    if (l.email && !c.email) c.email = l.email;
    if (l.preferencia_contato && !c.preferencia_contato)
      c.preferencia_contato = l.preferencia_contato;

    // Consentimento: uma vez dado, é do cliente (o mais restritivo prevalece
    // para descadastro; o consentimento vale se qualquer registro autorizou).
    if (l.consentimento_marketing) c.consentimento_marketing = true;
    if (l.descadastrado) c.descadastrado = true;

    const ct = ultimoTimestamp(l.created_date);
    if (ct > c.ultimo_contato_ts) {
      c.ultimo_contato_ts = ct;
      c.ultimo_contato = l.created_date;
    }

    const sit = l.situacao_atendimento || "";
    if (sit === "compareceu") {
      c.atendimentos++;
      c.total_gasto += Number(l.preco_servico) || 0;
      // Última visita = atendimento confirmado mais recente.
      const ref = l.data_agendamento || l.created_date;
      const ts = ultimoTimestamp(ref);
      if (ts >= c.ultima_visita_ts) {
        c.ultima_visita_ts = ts;
        c.ultima_visita = ref;
      }
    } else if (sit === "faltou") c.faltas++;
    else if (sit === "cancelado") c.cancelamentos++;

    if (sit && sit !== "pendente") c.total_agendado++;
    if (l.servico_interesse) c.servicos.add(l.servico_interesse);
    if (l.barbeiro_preferido) c.barbeiros.add(l.barbeiro_preferido);
  }

  return Array.from(mapa.values()).map((c) => {
    const diasSemVir = c.ultima_visita ? diasDesde(c.ultima_visita) : null;
    return {
      ...c,
      servicos: Array.from(c.servicos),
      barbeiros: Array.from(c.barbeiros),
      dias_sem_vir: diasSemVir,
      // Tem como contatar?
      tem_contato: Boolean(c.whatsapp || c.email),
      // Elegível para campanha: contato + consentimento + não descadastrado.
      elegivel: Boolean((c.whatsapp || c.email) && c.consentimento_marketing && !c.descadastrado),
      // Cliente que já veio e sumiu (base da reativação).
      sumido: c.atendimentos > 0 && diasSemVir != null && diasSemVir >= 60,
    };
  });
}

// Classificação da situação de "última visita" para orientar a ação.
export function situacaoCliente(c) {
  if (c.atendimentos === 0) {
    return { label: "Nunca compareceu", cls: "text-slate-400" };
  }
  const d = c.dias_sem_vir;
  if (d == null) return { label: "Ativo", cls: "text-emerald-300" };
  if (d <= 30) return { label: `Veio há ${d} dia(s)`, cls: "text-emerald-300" };
  if (d <= 60) return { label: `Há ${d} dias`, cls: "text-amber-300" };
  if (d <= 120) return { label: `Sumido há ${d} dias`, cls: "text-orange-300" };
  return { label: `Sumido há ${d} dias`, cls: "text-rose-300" };
}

export const CONTATO_OPTIONS = [
  { value: "all", label: "Todo contato" },
  { value: "com_contato", label: "Com contato" },
  { value: "whatsapp", label: "Tem WhatsApp" },
  { value: "email", label: "Tem e-mail" },
];

export const CONSENT_OPTIONS = [
  { value: "all", label: "Todo consentimento" },
  { value: "elegivel", label: "Elegíveis p/ campanha" },
  { value: "sem_consentimento", label: "Sem consentimento" },
  { value: "descadastrado", label: "Descadastrados" },
];

// Resumo da base para os cartões de KPI.
export function resumoRemarketing(clientes) {
  const comContato = clientes.filter((c) => c.tem_contato);
  const elegiveis = clientes.filter((c) => c.elegivel);
  const recorrentes = clientes.filter((c) => c.atendimentos >= 2);
  const sumidos = clientes.filter((c) => c.sumido);
  return {
    total: clientes.length,
    com_contato: comContato.length,
    elegiveis: elegiveis.length,
    sem_consentimento: comContato.length - elegiveis.length,
    recorrentes: recorrentes.length,
    sumidos: sumidos.length,
  };
}

// Exporta a lista consolidada para CSV.
export function exportRemarketingCSV(clientes) {
  const headers = [
    "Nome",
    "Telefone",
    "Email",
    "Preferencia_Contato",
    "Consentimento_Marketing",
    "Descadastrado",
    "Origem",
    "Atendimentos",
    "Ultima_Visita",
    "Dias_Sem_Vir",
    "Total_Gasto",
    "Servicos",
    "Barbeiros",
  ];
  const rows = clientes.map((c) => [
    c.nome || "",
    c.whatsapp || "",
    c.email || "",
    c.preferencia_contato || "",
    c.consentimento_marketing ? "Sim" : "Não",
    c.descadastrado ? "Sim" : "Não",
    c.origem,
    c.atendimentos,
    c.ultima_visita || "",
    c.dias_sem_vir == null ? "" : c.dias_sem_vir,
    c.total_gasto ? c.total_gasto.toFixed(2) : "",
    c.servicos.join(" | "),
    c.barbeiros.join(" | "),
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
  a.download = `clientes-remarketing-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
