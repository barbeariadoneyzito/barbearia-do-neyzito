import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { rangeQuery } from "@/lib/metricasPanel";
import {
  evolucaoDiaria,
  exportOrigemCSV,
  filtrarLeadsPorPeriodo,
  jornadaResumida,
  rankingOrigens,
  resumoOrigem,
  saidasPorDestino,
} from "@/lib/origemLeads";
import { BarChart3, CalendarCheck, Download, FileBarChart, LogOut, RefreshCw } from "lucide-react";
import MetricasTrackableLinks from "@/components/metricas/MetricasTrackableLinks";

const inputCls =
  "rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-white focus:border-[#A81C1C] focus:outline-none";

const PERIODOS = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "custom", label: "Período personalizado" },
];

function KPI({ label, value, sub, accent }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0E0E10] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-heading tracking-wide ${accent || "text-white"}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// Painel "Origem dos Leads": visão objetiva de aquisição.
// Ranking de origens (visitas → leads), evolução diária e detalhamento das
// visitas. Substitui o antigo painel de métricas, que tinha blocos demais.
export default function PainelOrigem() {
  const { user, logout } = useAuth();
  const [range, setRange] = useState("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [eventos, setEventos] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detalheOpen, setDetalheOpen] = useState(false);
  const [filtroOrigem, setFiltroOrigem] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Eventos do site são filtrados pela data de ocorrência (created_date).
      const q = rangeQuery(range, from, to);
      const [evPage, leadPage] = await Promise.all([
        base44.entities.AnalyticsEvent.filter(q, { sort: "-created_date", limit: 1000 }).catch(() => ({ items: [] })),
        // Leads: buscamos o histórico e filtramos por período LOCALMENTE pela
        // data do atendimento. Filtrar por created_date no servidor estava
        // errado: os atendimentos importados do AppBarber são criados hoje e
        // apareciam todos como "de hoje", escondendo o histórico real.
        base44.entities.Leads.list("-created_date", 2000).catch(() => []),
      ]);
      setEventos(evPage.items || []);
      setLeads(filtrarLeadsPorPeriodo(leadPage || [], range, from, to));
    } catch (e) {
      setError(e?.message || "Erro ao carregar os dados de origem.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, from, to]);

  const resumo = useMemo(() => resumoOrigem(eventos, leads), [eventos, leads]);
  const ranking = useMemo(() => rankingOrigens(eventos, leads), [eventos, leads]);
  const evolucao = useMemo(() => evolucaoDiaria(eventos, leads), [eventos, leads]);
  const jornada = useMemo(() => jornadaResumida(eventos), [eventos]);

  const rankingFiltrado = useMemo(
    () => (filtroOrigem ? ranking.filter((r) => r.origem === filtroOrigem) : ranking),
    [ranking, filtroOrigem]
  );
  const maxVisitas = Math.max(...rankingFiltrado.map((r) => r.visitas), 1);
  const maxEvolucao = Math.max(...evolucao.map((d) => Math.max(d.visitas, d.leads)), 1);
  const saidas = useMemo(() => saidasPorDestino(eventos), [eventos]);
  const maxSaidas = Math.max(...saidas.map((s) => s.total), 1);

  const semDados = !loading && eventos.length === 0 && leads.length === 0;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0E0E10]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#E05252]" />
            <h1 className="font-heading text-xl tracking-wide">ORIGEM DOS LEADS</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/painel-agenda"
              className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5"
            >
              <CalendarCheck className="h-4 w-4" /> Agenda &amp; Clientes
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
            <button
              onClick={() => exportOrigemCSV(rankingFiltrado)}
              disabled={!rankingFiltrado.length}
              className="text-xs text-white bg-[#A81C1C] hover:bg-[#C22424] px-3 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={() => logout()}
              className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <select value={range} onChange={(e) => setRange(e.target.value)} className={inputCls}>
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {range === "custom" && (
            <>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
              <span className="text-slate-500 text-sm">até</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
            </>
          )}
          <select value={filtroOrigem} onChange={(e) => setFiltroOrigem(e.target.value)} className={inputCls}>
            <option value="">Todas as origens</option>
            {ranking.map((r) => (
              <option key={r.origem} value={r.origem}>{r.origem}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-white/20 border-t-[#E05252] rounded-full animate-spin" />
          </div>
        ) : semDados ? (
          <div className="rounded-lg border border-white/10 bg-[#111113] p-10 text-center">
            <p className="text-slate-400">Ainda não há visitas nem leads neste período.</p>
            <p className="text-slate-600 text-sm mt-1">
              Os dados aparecem assim que a landing page receber visitas e o chat gravar leads.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <KPI label="Visitas" value={resumo.visitas} sub={`${resumo.sessoes} visitante(s)`} />
              <KPI label="Leads" value={resumo.leads} accent="text-emerald-300" />
              <KPI
                label="Conversão visita → lead"
                value={resumo.taxaVisitaLead == null ? "—" : `${resumo.taxaVisitaLead.toFixed(1)}%`}
                accent="text-[#E05252]"
              />
              <KPI label="Cliques AppBarber" value={resumo.cliquesAppbarber} />
              <KPI label="Cliques WhatsApp" value={resumo.cliquesWhatsapp} />
            </div>

            <section className="rounded-lg border border-white/10 bg-[#111113] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">De onde vêm as visitas e os leads</p>
                <button
                  onClick={() => setDetalheOpen((v) => !v)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {detalheOpen ? "Ocultar visitantes" : "Ver visitantes"}
                </button>
              </div>
              <div className="space-y-3">
                {rankingFiltrado.map((r) => (
                  <div key={r.origem}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-200 font-medium">{r.origem}</span>
                      <span className="text-slate-400">
                        <strong className="text-white">{r.leads}</strong> lead(s) ·{" "}
                        <strong className="text-white">{r.visitas}</strong> visita(s)
                        {r.taxa != null && <span className="text-slate-500"> · {r.taxa.toFixed(1)}%</span>}
                      </span>
                    </div>
                    <div className="h-3 rounded bg-white/5 overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-[#7a1414] to-[#A81C1C]"
                        style={{ width: `${(r.visitas / maxVisitas) * 100}%` }}
                        title={`${r.visitas} visitas`}
                      />
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${(r.leads / maxVisitas) * 100}%` }}
                        title={`${r.leads} leads`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Barra vermelha = visitas · barra verde = leads convertidos. Passando o mouse
                em cada barra, você vê quantas visitas e quantos leads vieram de cada origem.
              </p>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#111113] p-4 space-y-3">
              <p className="text-sm font-semibold text-white">Evolução diária</p>
              {evolucao.length === 0 ? (
                <p className="text-xs text-slate-500">Sem dados no período.</p>
              ) : (
                <div className="flex items-end gap-1 h-32 overflow-x-auto pb-1">
                  {evolucao.map((d) => (
                    <div key={d.date} className="flex flex-col items-center gap-1 shrink-0" title={`${d.label}: ${d.visitas} visitas · ${d.leads} leads`}>
                      <div className="flex items-end gap-0.5 h-24">
                        <div
                          className="w-2.5 rounded-t bg-[#A81C1C]"
                          style={{ height: `${Math.max((d.visitas / maxEvolucao) * 100, d.visitas ? 4 : 0)}%` }}
                        />
                        <div
                          className="w-2.5 rounded-t bg-emerald-500"
                          style={{ height: `${Math.max((d.leads / maxEvolucao) * 100, d.leads ? 4 : 0)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-600 whitespace-nowrap">{d.label}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-slate-500">Vermelho = visitas · verde = leads.</p>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#111113] p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-white">Saídas do site (cliques nos botões)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quem já estava no site e clicou para sair. Isso NÃO é origem: mede o uso dos botões,
                  não de onde o cliente veio.
                </p>
              </div>
              <div className="space-y-2">
                {saidas.map((s) => (
                  <div key={s.destino}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-200 font-medium">{s.label}</span>
                      <span className="text-slate-400">
                        <strong className="text-white">{s.total}</strong> clique(s)
                      </span>
                    </div>
                    <div className="h-2.5 rounded bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#2a5a8a] to-[#4a90d9]"
                        style={{ width: `${maxSaidas > 0 ? (s.total / maxSaidas) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {resumo.cliquesRedes === 0 && (
                <p className="text-[11px] text-amber-400/80">
                  Ainda não houve cliques nas redes sociais a partir do site. Se quiser saber quantos
                  clientes VÊM de cada rede, o caminho é a UTM na bio (seção "Links rastreáveis" abaixo).
                </p>
              )}
            </section>

            {detalheOpen && (
              <section className="rounded-lg border border-white/10 bg-[#111113] p-4 space-y-2">
                <p className="text-sm font-semibold text-white">O que cada visitante fez</p>
                <p className="text-xs text-slate-500">{jornada.length} visitante(s) único(s) no período.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-slate-500">
                      <tr className="text-left border-b border-white/10">
                        <th className="py-2 pr-4 font-medium">Origem</th>
                        <th className="py-2 pr-4 font-medium">Resultado</th>
                        <th className="py-2 pr-4 font-medium">Sessão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {jornada.slice(0, 200).map((j) => (
                        <tr key={j.sessao_id}>
                          <td className="py-2 pr-4 text-slate-300">{j.origem}</td>
                          <td className={`py-2 pr-4 ${
                            j.resultado === "Foi ao AppBarber" ? "text-[#E05252]"
                            : j.resultado === "Só visitou" ? "text-slate-500"
                            : "text-sky-300"
                          }`}>{j.resultado}</td>
                          <td className="py-2 pr-4 text-slate-600 font-mono">{j.sessao_id.slice(-6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        <MetricasTrackableLinks />

        <footer className="pt-4 text-center text-[11px] text-slate-600">
          Painel restrito — {user?.email || ""} · Design &amp; Desenvolvimento por Doni Leite CEO
        </footer>
      </main>
    </div>
  );
}
