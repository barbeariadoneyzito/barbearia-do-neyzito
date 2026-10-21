import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { formatBRL } from "@/lib/leadsPanel";
import { rangeQuery } from "@/lib/metricasPanel";
import {
  analiseServicos,
  comparativoMensal,
  desempenhoBarbeiros,
  exportRelatorioCSV,
  faltasEHorarios,
  funilSite,
  leadsDoMes,
  mesLabel,
  mesesDisponiveis,
  rankingClientes,
  serieMensal,
} from "@/lib/relatorioGerencial";
import { BarChart3, CalendarCheck, Download, LogOut, Printer, RefreshCw, Upload } from "lucide-react";
import ImportarAppBarber from "@/components/admin/ImportarAppBarber";
import {
  BarraH,
  brlCurto,
  Colunas,
  ItemFunil,
  KpiCard,
  Secao,
  Tabela,
  VariacaoBadge,
} from "@/components/relatorio/BlocosRelatorio";

const inputCls =
  "rounded-lg border border-white/10 bg-[#0A0A0B] px-3 py-2 text-sm text-white focus:border-[#A81C1C] focus:outline-none";

// Relatório Mensal — visão gerencial para entregar ao cliente.
//
// Seis análises: comparativo mês a mês, ranking de clientes, faltas/horários,
// desempenho por barbeiro, análise de serviços e funil do site. Pronto para
// imprimir/salvar em PDF e também exportável em CSV.
export default function PainelRelatorio() {
  const { user, logout } = useAuth();
  const [leads, setLeads] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [precoMap, setPrecoMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mes, setMes] = useState("");
  const [investimento, setInvestimento] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Todo o histórico: o relatório precisa de meses anteriores para o
      // comparativo, então não usamos rangeQuery aqui.
      const [leadsPage, servicosPage, evPage] = await Promise.all([
        base44.entities.Leads.list("-created_date", 2000),
        base44.entities.Servicos.filter({ ativo: true }, { sort: "nome", limit: 200 }).catch(() => ({ items: [] })),
        base44.entities.AnalyticsEvent.filter(rangeQuery("90d"), { sort: "-created_date", limit: 2000 }).catch(() => ({ items: [] })),
      ]);
      const mapa = {};
      for (const s of servicosPage.items || []) if (s.nome) mapa[s.nome] = s.preco;
      setPrecoMap(mapa);
      setLeads(leadsPage || []);
      setEventos(evPage.items || []);
    } catch (e) {
      setError(e?.message || "Erro ao carregar os dados do relatório.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const meses = useMemo(() => mesesDisponiveis(leads), [leads]);

  // Mês inicial: o mais recente com dados.
  useEffect(() => {
    if (!mes && meses.length > 0) setMes(meses[0]);
  }, [meses, mes]);

  const investNum = Number(String(investimento).replace(",", ".")) || 0;

  const comparativo = useMemo(
    () => (mes ? comparativoMensal(leads, mes, precoMap, investNum) : null),
    [leads, mes, precoMap, investNum]
  );
  const doMes = useMemo(() => (mes ? leadsDoMes(leads, mes) : []), [leads, mes]);
  const clientes = useMemo(() => rankingClientes(doMes, precoMap, 10), [doMes, precoMap]);
  const faltas = useMemo(() => faltasEHorarios(doMes, precoMap), [doMes, precoMap]);
  const barbeiros = useMemo(() => desempenhoBarbeiros(doMes, precoMap), [doMes, precoMap]);
  const servicos = useMemo(() => analiseServicos(doMes, precoMap), [doMes, precoMap]);
  const funil = useMemo(() => funilSite(eventos, doMes, precoMap), [eventos, doMes, precoMap]);
  const serie = useMemo(() => serieMensal(leads, precoMap, 6), [leads, precoMap]);

  const semDados = !loading && leads.length === 0;
  const geradoEm = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const exportarCSV = () => {
    exportRelatorioCSV({
      mes,
      comparativo,
      clientes,
      faltas,
      barbeiros,
      servicos,
      funil,
      investimento: investNum,
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0E0E10]/95 backdrop-blur print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#E05252]" />
            <h1 className="font-heading text-xl tracking-wide">RELATÓRIO MENSAL</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Botão dedicado: busca e insere toda a movimentação do AppBarber.
                Fica em destaque porque é o primeiro passo do relatório — sem
                essa importação o relatório não tem atendimentos. */}
            <ImportarAppBarber
              onImportado={load}
              rotulo="Buscar movimentação do AppBarber"
              Icone={Upload}
              variante="destaque"
            />
            <Link
              to="/painel-agenda"
              className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5"
            >
              <CalendarCheck className="h-4 w-4" /> Agenda &amp; Clientes
            </Link>
            <button
              onClick={load}
              disabled={loading}
              className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </button>
            <button
              onClick={() => window.print()}
              disabled={!comparativo}
              className="text-xs text-slate-300 hover:text-white border border-white/10 px-3 py-2 rounded-md inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </button>
            <button
              onClick={exportarCSV}
              disabled={!comparativo}
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

        {/* Cabeçalho do documento: identifica o relatório na hora de imprimir. */}
        <div className="rounded-lg border border-white/10 bg-[#111113] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#E05252]">Barbearia do Neyzito</p>
              <h2 className="font-heading text-2xl tracking-wide mt-0.5">
                Relatório de {mes ? mesLabel(mes) : "—"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Gerado em {geradoEm} (horário de Brasília)</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                Mês
                <select value={mes} onChange={(e) => setMes(e.target.value)} className={inputCls}>
                  {meses.length === 0 && <option value="">sem dados</option>}
                  {meses.map((m) => (
                    <option key={m} value={m}>{mesLabel(m)}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                Investimento em tráfego (R$)
                <input
                  value={investimento}
                  onChange={(e) => setInvestimento(e.target.value)}
                  placeholder="0,00"
                  className={`${inputCls} w-28`}
                />
              </label>
            </div>
          </div>
          {investNum > 0 && (
            <p className="text-[11px] text-slate-500 mt-2">
              Investimento informado: <strong className="text-slate-300">{formatBRL(investNum)}</strong> — usado para
              calcular CPA, CAC e ROAS na seção 1.
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-white/20 border-t-[#E05252] rounded-full animate-spin" />
          </div>
        ) : semDados ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4">
            <div>
              <p className="text-amber-200 font-medium">Nenhum atendimento importado ainda.</p>
              <p className="text-slate-400 text-sm mt-1">
                Os agendamentos vivem dentro do AppBarber — eles só aparecem aqui depois de
                buscados. Enquanto não forem importados, todo relatório fica zerado. Nada foi perdido.
              </p>
            </div>
            <ImportarAppBarber
              onImportado={load}
              rotulo="Buscar todo o histórico do AppBarber"
              Icone={Upload}
              variante="claro"
            />
            <p className="text-[11px] text-slate-500">
              No AppBarber: <strong className="text-slate-400">Relatórios → Agendamentos → Informações</strong> → tipo
              “Agendamentos por Plataforma” → Status “Realizado” → escolha as datas → botão{" "}
              <strong className="text-slate-400">“Detalhes”</strong> → selecione a lista e copie. Depois cole na aba{" "}
              <strong className="text-slate-400">“Colar texto”</strong>.
            </p>
          </div>
        ) : !comparativo ? (
          <div className="rounded-lg border border-white/10 bg-[#111113] p-10 text-center text-slate-400 text-sm">
            Selecione um mês para ver o relatório.
          </div>
        ) : (
          <>
            {/* KPIs do mês, com variação em relação ao mês anterior. */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard
                label="Rendimento"
                value={formatBRL(comparativo.atual.rendimento)}
                sub={`${mesLabel(comparativo.mes_anterior)}: ${formatBRL(comparativo.anterior.rendimento)}`}
                variacao={comparativo.variacao.rendimento}
              />
              <KpiCard
                label="Atendimentos"
                value={comparativo.atual.atendimentos}
                sub={`${mesLabel(comparativo.mes_anterior)}: ${comparativo.anterior.atendimentos}`}
                variacao={comparativo.variacao.atendimentos}
              />
              <KpiCard
                label="Ticket médio"
                value={formatBRL(comparativo.atual.ticket)}
                sub={`${mesLabel(comparativo.mes_anterior)}: ${formatBRL(comparativo.anterior.ticket)}`}
                variacao={comparativo.variacao.ticket}
              />
              <KpiCard
                label="Clientes atendidos"
                value={clientes.clientes_ativos}
                sub={`${clientes.recorrentes} recorrente(s) · ${clientes.total_clientes} cadastrado(s)`}
              />
            </div>

            {/* 1. Comparativo mês a mês */}
            <Secao
              numero="1"
              titulo="Comparativo mês a mês"
              descricao={`${mesLabel(mes)} comparado com ${mesLabel(comparativo.mes_anterior)}.`}
            >
              <Tabela
                colunas={["Indicador", mesLabel(mes), mesLabel(comparativo.mes_anterior), "Variação"]}
                linhas={[
                  ["Rendimento", formatBRL(comparativo.atual.rendimento), formatBRL(comparativo.anterior.rendimento), <VariacaoBadge valor={comparativo.variacao.rendimento} />],
                  ["Atendimentos", comparativo.atual.atendimentos, comparativo.anterior.atendimentos, <VariacaoBadge valor={comparativo.variacao.atendimentos} />],
                  ["Ticket médio", formatBRL(comparativo.atual.ticket), formatBRL(comparativo.anterior.ticket), <VariacaoBadge valor={comparativo.variacao.ticket} />],
                  ["Registros/leads", comparativo.atual.leads, comparativo.anterior.leads, <VariacaoBadge valor={comparativo.variacao.leads} />],
                  [
                    "Taxa de comparecimento",
                    comparativo.atual.taxa_comparecimento == null ? "—" : `${comparativo.atual.taxa_comparecimento.toFixed(1)}%`,
                    comparativo.anterior.taxa_comparecimento == null ? "—" : `${comparativo.anterior.taxa_comparecimento.toFixed(1)}%`,
                    "",
                  ],
                  [
                    "Taxa de falta (no-show)",
                    comparativo.atual.taxa_falta == null ? "—" : `${comparativo.atual.taxa_falta.toFixed(1)}%`,
                    comparativo.anterior.taxa_falta == null ? "—" : `${comparativo.anterior.taxa_falta.toFixed(1)}%`,
                    "",
                  ],
                ]}
              />

              {investNum > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <KpiCard label="CPA (custo por atendimento)" value={comparativo.cpa == null ? "—" : formatBRL(comparativo.cpa)} />
                  <KpiCard label="CAC (custo por lead)" value={comparativo.cac == null ? "—" : formatBRL(comparativo.cac)} />
                  <KpiCard
                    label="ROAS (retorno sobre anúncio)"
                    value={comparativo.roas == null ? "—" : `${comparativo.roas.toFixed(2)}x`}
                    accent={comparativo.roas >= 1 ? "text-emerald-300" : "text-amber-300"}
                  />
                </div>
              )}

              {serie.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-slate-300 mb-2">Evolução dos últimos meses — rendimento</p>
                  <Colunas dados={serie} chaveValor="rendimento" chaveLabel="label" chaveNome="nome" formatar={brlCurto} />
                </div>
              )}
            </Secao>

            {/* 2. Ranking de clientes */}
            <Secao
              numero="2"
              titulo="Ranking de clientes"
              descricao={`${clientes.clientes_ativos} cliente(s) atendido(s) no mês · recorrência de ${clientes.taxa_recorrencia == null ? "—" : clientes.taxa_recorrencia.toFixed(1) + "%"} · média de ${clientes.visitas_media.toFixed(2)} visita(s) por cliente.`}
            >
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-medium text-slate-300 mb-2">Top 10 por gasto</p>
                  <div className="space-y-2.5">
                    {clientes.por_gasto.filter((c) => c.total_gasto > 0).length === 0 ? (
                      <p className="text-xs text-slate-500">Sem clientes com gasto no período.</p>
                    ) : (
                      clientes.por_gasto
                        .filter((c) => c.total_gasto > 0)
                        .map((c) => (
                          <BarraH
                            key={c.key}
                            label={c.nome}
                            valor={c.total_gasto}
                            max={clientes.por_gasto[0]?.total_gasto || 1}
                            valorTexto={formatBRL(c.total_gasto)}
                            sub={`${c.visitas} visita(s) · ticket ${formatBRL(c.ticket)}`}
                          />
                        ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300 mb-2">Top 10 por frequência</p>
                  <Tabela
                    colunas={["#", "Cliente", "Visitas", "Faltas", "Total gasto"]}
                    linhas={clientes.por_frequencia
                      .filter((c) => c.visitas > 0)
                      .map((c, i) => [
                        i + 1,
                        c.nome,
                        c.visitas,
                        c.faltas,
                        { text: formatBRL(c.total_gasto), align: "right" },
                      ])}
                    vazio="Sem clientes com visita no período."
                  />
                </div>
              </div>
            </Secao>

            {/* 3. Faltas e horários */}
            <Secao
              numero="3"
              titulo="Faltas e horários de pico"
              descricao="Onde estão as faltas e quando a barbearia realmente trabalha."
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Faltas no mês" value={faltas.total_faltas} accent="text-rose-300" />
                <KpiCard label="Taxa de falta" value={faltas.taxa_falta == null ? "—" : `${faltas.taxa_falta.toFixed(1)}%`} accent="text-rose-300" />
                <KpiCard label="Dia de pico" value={faltas.dia_pico || "—"} />
                <KpiCard label="Horário de pico" value={faltas.hora_pico || "—"} />
              </div>

              <div className="grid md:grid-cols-2 gap-5 pt-1">
                <div>
                  <p className="text-xs font-medium text-slate-300 mb-2">Atendimentos por dia da semana</p>
                  <div className="space-y-2.5">
                    {faltas.por_dia.map((d) => (
                      <BarraH
                        key={d.dia}
                        label={d.dia}
                        valor={d.atendimentos}
                        max={Math.max(...faltas.por_dia.map((x) => x.atendimentos), 1)}
                        valorTexto={`${d.atendimentos} atend.`}
                        sub={`${d.faltas} falta(s) · ${formatBRL(d.rendimento)}`}
                        cor="from-[#2a5a8a] to-[#4a90d9]"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300 mb-2">Atendimentos por horário</p>
                  <Tabela
                    colunas={["Horário", "Atendimentos"]}
                    linhas={faltas.por_hora.map((h) => [h.label, h.atendimentos])}
                    vazio="Sem horários identificados no período."
                  />
                </div>
              </div>
            </Secao>

            {/* 4. Desempenho por barbeiro */}
            <Secao
              numero="4"
              titulo="Desempenho por barbeiro"
              descricao="Quem produz, quanto fatura e com que ticket."
            >
              {barbeiros.length === 0 ? (
                <p className="text-xs text-slate-500">Sem atendimentos por barbeiro no período.</p>
              ) : (
                <>
                  <div className="space-y-2.5">
                    {barbeiros.map((b) => (
                      <BarraH
                        key={b.barbeiro}
                        label={b.barbeiro}
                        valor={b.rendimento}
                        max={barbeiros[0]?.rendimento || 1}
                        valorTexto={formatBRL(b.rendimento)}
                        sub={`${b.atendimentos} atend. · ${b.participacao.toFixed(1)}% do faturamento · ticket ${formatBRL(b.ticket)} · ${b.clientes} cliente(s)`}
                        cor="from-[#0f5c3a] to-[#22c55e]"
                      />
                    ))}
                  </div>
                  <Tabela
                    colunas={["Barbeiro", "Atendimentos", "Clientes", "Rendimento", "Ticket médio", "Faltas", "Serviço top"]}
                    linhas={barbeiros.map((b) => [
                      { text: b.barbeiro, cls: "text-white font-medium" },
                      b.atendimentos,
                      b.clientes,
                      { text: formatBRL(b.rendimento), align: "right" },
                      { text: formatBRL(b.ticket), align: "right" },
                      { text: b.faltas, cls: b.faltas > 0 ? "text-rose-300" : "" },
                      b.servico_top,
                    ])}
                  />
                </>
              )}
            </Secao>

            {/* 5. Análise de serviços */}
            <Secao
              numero="5"
              titulo="Análise de serviços"
              descricao="O que mais vende, o que mais rende e o peso de cada serviço no faturamento."
            >
              {servicos.lista.length === 0 ? (
                <p className="text-xs text-slate-500">Sem serviços registrados no período.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <KpiCard
                      label="Serviço mais rentável"
                      value={servicos.mais_rentavel?.servico || "—"}
                      sub={servicos.mais_rentavel ? formatBRL(servicos.mais_rentavel.rendimento) : ""}
                    />
                    <KpiCard
                      label="Serviço mais vendido"
                      value={servicos.mais_vendido?.servico || "—"}
                      sub={servicos.mais_vendido ? `${servicos.mais_vendido.atendimentos} atend.` : ""}
                    />
                    <KpiCard
                      label="Serviço menos vendido"
                      value={servicos.menos_vendido?.servico || "—"}
                      sub={servicos.menos_vendido ? `${servicos.menos_vendido.atendimentos} atend.` : ""}
                      accent="text-amber-300"
                    />
                  </div>
                  <div className="space-y-2.5 pt-1">
                    {servicos.lista.map((s) => (
                      <BarraH
                        key={s.servico}
                        label={s.servico}
                        valor={s.rendimento}
                        max={servicos.lista[0]?.rendimento || 1}
                        valorTexto={`${formatBRL(s.rendimento)} · ${s.participacao.toFixed(1)}%`}
                        sub={`${s.atendimentos} atend. · ${s.clientes} cliente(s) · ticket ${formatBRL(s.ticket)}`}
                        cor="from-[#6a4a0a] to-[#eab308]"
                      />
                    ))}
                  </div>
                </>
              )}
            </Secao>

            {/* 6. Funil do site */}
            <Secao
              numero="6"
              titulo="Funil de conversão do site"
              descricao="Da visita na landing page até o atendimento realizado. Eventos dos últimos 90 dias."
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Visitas ao site" value={funil.visitas} sub={`${funil.sessoes} visitante(s)`} />
                <KpiCard label="Cliques no AppBarber" value={funil.cliques_appbarber} />
                <KpiCard label="Leads registrados" value={funil.leads} />
                <KpiCard label="Atendimentos realizados" value={funil.atendimentos} accent="text-emerald-300" />
              </div>

              <div className="space-y-3 pt-1">
                {funil.etapas.map((e, i) => {
                  const anterior = i > 0 ? funil.etapas[i - 1].valor : null;
                  const taxa = anterior && anterior > 0 ? (e.valor / anterior) * 100 : null;
                  return (
                    <ItemFunil
                      key={e.etapa}
                      etapa={e.etapa}
                      valor={e.valor}
                      total={funil.etapas[0].valor || 1}
                      taxaAnterior={i > 0 ? taxa : null}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <KpiCard label="Visita → clique" value={funil.taxa_visita_clique == null ? "—" : `${funil.taxa_visita_clique.toFixed(1)}%`} />
                <KpiCard label="Clique → lead" value={funil.taxa_clique_lead == null ? "—" : `${funil.taxa_clique_lead.toFixed(1)}%`} />
                <KpiCard label="Lead → atendimento" value={funil.taxa_lead_atendimento == null ? "—" : `${funil.taxa_lead_atendimento.toFixed(1)}%`} />
                <KpiCard label="Cliques no WhatsApp" value={funil.cliques_whatsapp} />
              </div>
            </Secao>

            <p className="text-[11px] text-slate-600 text-center pt-2">
              Relatório restrito — {user?.email || ""} · Barbearia do Neyzito · Design &amp; Desenvolvimento por Doni Leite
            </p>
          </>
        )}
      </main>
    </div>
  );
}
