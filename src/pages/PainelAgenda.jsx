import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import LeadsRemarketing from "@/components/admin/LeadsRemarketing";
import ImportarAppBarber from "@/components/admin/ImportarAppBarber";
import { consolidarClientes } from "@/lib/remarketing";
import {
  PERIODOS,
  SITUACAO_FILTRO,
  construirLinhas,
  exportConsolidadoCSV,
  filtrarPorPeriodo,
  resumoConsolidado,
} from "@/lib/relatorioConsolidado";
import { formatBRL, formatDateOnly, origemLabel, situacaoLabel } from "@/lib/leadsPanel";
import { BarChart3, CalendarCheck, Download, FileBarChart, LogOut, RefreshCw, Search, Users } from "lucide-react";

const inputCls =
  "rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-white focus:border-[#A81C1C] focus:outline-none";

const situacaoCls = {
  compareceu: "text-emerald-300",
  faltou: "text-rose-300",
  cancelado: "text-rose-300",
  reagendado: "text-amber-300",
  confirmado: "text-blue-300",
  pendente: "text-amber-300",
};

function KPI({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0E0E10] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-heading tracking-wide ${accent || "text-white"}`}>{value}</p>
    </div>
  );
}

// Painel "Agenda & Clientes": tudo que é agendamento e cliente em um só lugar.
//   Aba Agenda   -> tabela mestre dos atendimentos (quem, serviço, barbeiro,
//                   situação, valor), filtrável e exportável.
//   Aba Clientes -> lista consolidada para remarketing (uma linha por pessoa).
// Substitui os antigos painéis de Leads e Relatório Consolidado.
export default function PainelAgenda() {
  const { user, logout } = useAuth();
  const [view, setView] = useState("agenda");
  const [leads, setLeads] = useState([]);
  const [precoMap, setPrecoMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [periodo, setPeriodo] = useState("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [barbeiro, setBarbeiro] = useState("all");
  const [origem, setOrigem] = useState("all");
  const [situacao, setSituacao] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsPage, servicosPage] = await Promise.all([
        base44.entities.Leads.list("-created_date", 2000),
        base44.entities.Servicos.filter({ ativo: true }, { sort: "nome", limit: 100 }).catch(() => ({ items: [] })),
      ]);
      const mapa = {};
      for (const s of servicosPage.items || []) if (s.nome) mapa[s.nome] = s.preco;
      setPrecoMap(mapa);
      setLeads(leadsPage || []);
    } catch (e) {
      setError(e?.message || "Erro ao carregar a agenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const clientes = useMemo(() => consolidarClientes(leads), [leads]);

  const linhas = useMemo(() => {
    const noPeriodo = filtrarPorPeriodo(leads, periodo, from, to);
    const todas = construirLinhas(noPeriodo, precoMap);
    const q = search.trim().toLowerCase();
    return todas.filter((r) => {
      if (barbeiro !== "all" && r.barbeiro !== barbeiro) return false;
      if (origem !== "all" && r.origem !== origem) return false;
      if (situacao !== "all") {
        if (situacao === "pendente" && r.situacao && r.situacao !== "pendente") return false;
        if (situacao !== "pendente" && r.situacao !== situacao) return false;
      }
      if (q && !(
        (r.nome || "").toLowerCase().includes(q) ||
        (r.whatsapp || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [leads, precoMap, periodo, from, to, barbeiro, origem, situacao, search]);

  const resumo = useMemo(() => resumoConsolidado(linhas), [linhas]);

  const barbeirosOpts = useMemo(
    () => Array.from(new Set(construirLinhas(leads, precoMap).map((r) => r.barbeiro))).sort(),
    [leads, precoMap]
  );
  const origensOpts = useMemo(
    () => Array.from(new Set(construirLinhas(leads, precoMap).map((r) => r.origem))).sort(),
    [leads, precoMap]
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0E0E10]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-[#E05252]" />
            <h1 className="font-heading text-xl tracking-wide">AGENDA &amp; CLIENTES</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/painel-origem"
              className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5"
            >
              <BarChart3 className="h-4 w-4" /> Origem dos Leads
            </Link>
            <Link
              to="/painel-relatorio"
              className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5"
            >
              <FileBarChart className="h-4 w-4" /> Relatório
            </Link>
            <button
              onClick={load}
              disabled={loading}
              className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </button>
            {view === "agenda" && (
              <ImportarAppBarber onImportado={load} rotulo="Buscar movimentação do AppBarber" variante="destaque" />
            )}
            {view === "agenda" && (
              <button
                onClick={() => exportConsolidadoCSV(linhas)}
                disabled={!linhas.length}
                className="text-xs text-white bg-[#A81C1C] hover:bg-[#C22424] px-3 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="h-4 w-4" /> CSV
              </button>
            )}
            <button
              onClick={() => logout()}
              className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111113] p-1 w-fit">
          {[
            { key: "agenda", label: "Agenda", Icon: CalendarCheck },
            { key: "clientes", label: "Clientes", Icon: Users },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`px-4 py-1.5 text-sm rounded-md inline-flex items-center gap-1.5 transition-colors ${
                view === t.key ? "bg-[#A81C1C] text-white" : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <t.Icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-white/20 border-t-[#E05252] rounded-full animate-spin" />
          </div>
        ) : view === "clientes" ? (
          <LeadsRemarketing clientes={clientes} />
        ) : (
          <>
            <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={inputCls}>
                  {PERIODOS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                {periodo === "custom" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-400">
                      De
                      <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-400">
                      Até
                      <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
                    </label>
                    {(from || to) && (
                      <button
                        onClick={() => { setFrom(""); setTo(""); }}
                        className="text-xs text-slate-400 hover:text-white border border-white/10 px-2 py-1 rounded"
                      >
                        Limpar
                      </button>
                    )}
                    {!from && !to && (
                      <span className="text-[11px] text-amber-400/80">
                        Escolha as datas — sem datas o período fica aberto.
                      </span>
                    )}
                  </div>
                )}
                <select value={barbeiro} onChange={(e) => setBarbeiro(e.target.value)} className={inputCls}>
                  <option value="all">Todos os barbeiros</option>
                  {barbeirosOpts.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <select value={origem} onChange={(e) => setOrigem(e.target.value)} className={inputCls}>
                  <option value="all">Todas as origens</option>
                  {origensOpts.map((o) => (
                    <option key={o} value={o}>{origemLabel(o)}</option>
                  ))}
                </select>
                <select value={situacao} onChange={(e) => setSituacao(e.target.value)} className={inputCls}>
                  {SITUACAO_FILTRO.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar nome, telefone ou e-mail"
                    className={`${inputCls} w-full pl-9`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KPI label="Registros" value={resumo.total} />
              <KPI label="Compareceu" value={resumo.compareceu} accent="text-emerald-300" />
              <KPI label="Faltou" value={resumo.faltou} accent="text-rose-300" />
              <KPI label="Cancelado" value={resumo.cancelado} accent="text-rose-300" />
              <KPI label="Rendimento" value={formatBRL(resumo.rendimento)} />
              <KPI label="Ticket médio" value={resumo.compareceu ? formatBRL(resumo.ticket) : "—"} />
            </div>

            {resumo.topOrigens.length > 0 && (
              <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
                <p className="text-sm font-semibold text-white mb-2">Origem dos clientes no período</p>
                <div className="flex flex-wrap gap-2">
                  {resumo.topOrigens.map((o) => (
                    <span
                      key={o.origem}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0E0E10] px-3 py-1 text-xs text-slate-300"
                    >
                      {origemLabel(o.origem)}
                      <span className="text-white font-semibold">{o.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {linhas.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                Nenhum registro no período/filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-[#0E0E10] text-slate-400">
                    <tr className="text-left">
                      <th className="px-3 py-3 font-medium">Data</th>
                      <th className="px-3 py-3 font-medium">Cliente</th>
                      <th className="px-3 py-3 font-medium">Contato</th>
                      <th className="px-3 py-3 font-medium">Serviço</th>
                      <th className="px-3 py-3 font-medium">Barbeiro</th>
                      <th className="px-3 py-3 font-medium">Origem</th>
                      <th className="px-3 py-3 font-medium">Situação</th>
                      <th className="px-3 py-3 font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {linhas.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.02] align-top">
                        <td className="px-3 py-3 text-slate-300 whitespace-nowrap">
                          {r.data ? formatDateOnly(r.data) : "—"}
                        </td>
                        <td className="px-3 py-3 text-white font-medium">{r.nome}</td>
                        <td className="px-3 py-3 text-slate-300">
                          {r.whatsapp && <p>{r.whatsapp}</p>}
                          {r.email && <p className="text-[11px] text-slate-500 break-all">{r.email}</p>}
                        </td>
                        <td className="px-3 py-3 text-slate-300">{r.servico}</td>
                        <td className="px-3 py-3 text-slate-300">{r.barbeiro}</td>
                        <td className="px-3 py-3 text-slate-300">
                          {origemLabel(r.origem)}
                          {r.utm_source && <p className="text-[11px] text-slate-500">utm: {r.utm_source}</p>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {r.situacao ? (
                            <span className={situacaoCls[r.situacao] || "text-slate-400"}>
                              {situacaoLabel(r.situacao)}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-white font-semibold">
                          {r.compareceu ? formatBRL(r.valor) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Mostrando <strong className="text-slate-300">{linhas.length}</strong> registro(s). O rendimento conta
              apenas atendimentos marcados como <strong>compareceu</strong>.
            </p>
          </>
        )}

        <footer className="pt-4 text-center text-[11px] text-slate-600">
          Painel restrito — {user?.email || ""} · Design &amp; Desenvolvimento por Doni Leite CEO
        </footer>
      </main>
    </div>
  );
}
