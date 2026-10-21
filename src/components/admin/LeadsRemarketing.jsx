import { useMemo, useState } from "react";
import {
  CONSENT_OPTIONS,
  CONTATO_OPTIONS,
  exportRemarketingCSV,
  situacaoCliente,
} from "@/lib/remarketing";
import { formatBRL, formatDateOnly, whatsappLink } from "@/lib/leadsPanel";
import { Download, Mail, MessageCircle, Search, Users } from "lucide-react";

const KPI = ({ label, value, accent }) => (
  <div className="rounded-lg border border-white/10 bg-[#0E0E10] px-4 py-3">
    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-1 text-xl font-heading tracking-wide ${accent || "text-white"}`}>{value}</p>
  </div>
);

const badge = (label, cls) => (
  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
    {label}
  </span>
);

const inputCls =
  "rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-white focus:border-[#A81C1C] focus:outline-none";

// Lista de clientes para remarketing: uma linha por pessoa (telefone/e-mail
// consolidados), com última visita, recorrência, consentimento e contato
// rápido por WhatsApp. Feita para reativar clientes e disparar campanhas.
export default function LeadsRemarketing({ clientes }) {
  const [search, setSearch] = useState("");
  const [contato, setContato] = useState("all");
  const [consent, setConsent] = useState("all");
  const [recorrencia, setRecorrencia] = useState("all");
  const [ordenacao, setOrdenacao] = useState("sumidos");

  const resumo = useMemo(() => {
    const comContato = clientes.filter((c) => c.tem_contato);
    const elegiveis = clientes.filter((c) => c.elegivel);
    return {
      total: clientes.length,
      comContato: comContato.length,
      elegiveis: elegiveis.length,
      recorrentes: clientes.filter((c) => c.atendimentos >= 2).length,
      sumidos: clientes.filter((c) => c.sumido).length,
    };
  }, [clientes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = clientes.filter((c) => {
      if (q && !(
        (c.nome || "").toLowerCase().includes(q) ||
        (c.whatsapp || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
      )) return false;

      if (contato === "whatsapp" && !c.whatsapp) return false;
      if (contato === "email" && !c.email) return false;
      if (contato === "com_contato" && !c.tem_contato) return false;

      if (consent === "elegivel" && !c.elegivel) return false;
      if (consent === "sem_consentimento" && (c.consentimento_marketing || !c.tem_contato)) return false;
      if (consent === "descadastrado" && !c.descadastrado) return false;

      if (recorrencia === "sumidos" && !c.sumido) return false;
      if (recorrencia === "recorrentes" && c.atendimentos < 2) return false;
      if (recorrencia === "nunca_veio" && c.atendimentos > 0) return false;

      return true;
    });

    const ordenadores = {
      sumidos: (a, b) => (b.dias_sem_vir ?? -1) - (a.dias_sem_vir ?? -1),
      nome: (a, b) => (a.nome || "").localeCompare(b.nome || ""),
      atendimentos: (a, b) => b.atendimentos - a.atendimentos,
      gasto: (a, b) => b.total_gasto - a.total_gasto,
      recentes: (a, b) => (b.ultima_visita_ts || b.ultimo_contato_ts || 0) - (a.ultima_visita_ts || a.ultimo_contato_ts || 0),
    };
    return rows.sort(ordenadores[ordenacao] || ordenadores.sumidos);
  }, [clientes, search, contato, consent, recorrencia, ordenacao]);

  return (
    <section className="rounded-lg border border-white/10 bg-[#111113] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#E05252]" />
          <h2 className="font-heading text-lg tracking-wide">CLIENTES PARA REMARKETING</h2>
        </div>
        <button
          onClick={() => exportRemarketingCSV(filtered)}
          disabled={!filtered.length}
          className="text-xs text-white bg-[#A81C1C] hover:bg-[#C22424] px-3 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <p className="text-xs text-slate-400 -mt-2">
        Uma linha por cliente (telefone/e-mail consolidados). Use para reativar quem sumiu e disparar campanhas
        — sempre respeitando o consentimento e o descadastro.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KPI label="Clientes" value={resumo.total} />
        <KPI label="Com contato" value={resumo.comContato} accent="text-blue-300" />
        <KPI label="Elegíveis p/ campanha" value={resumo.elegiveis} accent="text-emerald-300" />
        <KPI label="Recorrentes (2+)" value={resumo.recorrentes} accent="text-white" />
        <KPI label="Sumidos (60+ dias)" value={resumo.sumidos} accent="text-amber-300" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, telefone ou e-mail"
            className={`${inputCls} w-full pl-9`}
          />
        </div>
        <select value={contato} onChange={(e) => setContato(e.target.value)} className={inputCls}>
          {CONTATO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={consent} onChange={(e) => setConsent(e.target.value)} className={inputCls}>
          {CONSENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={recorrencia} onChange={(e) => setRecorrencia(e.target.value)} className={inputCls}>
          <option value="all">Todos</option>
          <option value="sumidos">Sumidos (60+ dias)</option>
          <option value="recorrentes">Recorrentes (2+)</option>
          <option value="nunca_veio">Nunca compareceu</option>
        </select>
        <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} className={inputCls}>
          <option value="sumidos">Ordenar: mais tempo sem vir</option>
          <option value="recentes">Ordenar: visita mais recente</option>
          <option value="atendimentos">Ordenar: mais atendimentos</option>
          <option value="gasto">Ordenar: maior gasto</option>
          <option value="nome">Ordenar: nome (A-Z)</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-[#0E0E10] text-slate-400">
            <tr className="text-left">
              <th className="px-3 py-3 font-medium">Cliente</th>
              <th className="px-3 py-3 font-medium">Contato</th>
              <th className="px-3 py-3 font-medium">Consentimento</th>
              <th className="px-3 py-3 font-medium">Atendimentos</th>
              <th className="px-3 py-3 font-medium">Última visita</th>
              <th className="px-3 py-3 font-medium">Gasto total</th>
              <th className="px-3 py-3 font-medium">Preferências</th>
              <th className="px-3 py-3 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                  Nenhum cliente com os filtros atuais.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const sit = situacaoCliente(c);
                const wa = whatsappLink(c.whatsapp);
                return (
                  <tr key={c.key} className="hover:bg-white/[0.02] align-top">
                    <td className="px-3 py-3">
                      <p className="text-white font-medium">{c.nome || "—"}</p>
                      <p className="text-[11px] text-slate-500">{c.origem}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-300">
                      {c.whatsapp && <p>{c.whatsapp}</p>}
                      {c.email && <p className="text-[11px] text-slate-500 break-all">{c.email}</p>}
                    </td>
                    <td className="px-3 py-3">
                      {c.descadastrado
                        ? badge("Descadastrado", "border-red-500/30 bg-red-500/15 text-red-300")
                        : c.consentimento_marketing
                        ? badge("Autorizado", "border-emerald-500/30 bg-emerald-500/15 text-emerald-300")
                        : badge("Sem consentimento", "border-slate-500/30 bg-slate-500/15 text-slate-300")}
                    </td>
                    <td className="px-3 py-3 text-slate-300">
                      {c.atendimentos}
                      {c.faltas > 0 && <span className="text-[11px] text-rose-300"> · {c.faltas} falta(s)</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {c.ultima_visita ? (
                        <div>
                          <p className="text-slate-300">{formatDateOnly(c.ultima_visita)}</p>
                          <p className={`text-[11px] ${sit.cls}`}>{sit.label}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500">Nunca veio</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-300 whitespace-nowrap">
                      {c.total_gasto ? formatBRL(c.total_gasto) : "—"}
                    </td>
                    <td className="px-3 py-3 text-[11px] text-slate-400">
                      {c.servicos.length > 0 && <p>Serviços: {c.servicos.join(", ")}</p>}
                      {c.barbeiros.length > 0 && <p>Barbeiros: {c.barbeiros.join(", ")}</p>}
                      {c.preferencia_contato && <p>Prefere: {c.preferencia_contato}</p>}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir conversa no WhatsApp"
                            className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-md px-2 py-1"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        )}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            title="Enviar e-mail"
                            className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200 border border-blue-500/30 rounded-md px-2 py-1"
                          >
                            <Mail className="h-3.5 w-3.5" /> E-mail
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Mostrando <strong className="text-slate-300">{filtered.length}</strong> de {clientes.length} cliente(s).
        "Elegíveis para campanha" = tem contato, autorizou marketing e não está descadastrado.
      </p>
    </section>
  );
}
