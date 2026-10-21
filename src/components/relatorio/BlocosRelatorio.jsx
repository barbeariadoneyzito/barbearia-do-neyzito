// Blocos visuais reutilizados pelo Relatório Mensal.
// Componentes "burros" (só apresentação), com estilo escuro alinhado ao resto
// do painel e pensados para ficar legíveis também na impressão/PDF.

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

// Cartão de indicador com valor, rótulo e eventual variação.
export function KpiCard({ label, value, sub, accent, variacao, variacaoLabel }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0E0E10] px-4 py-3 break-inside-avoid">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-heading tracking-wide ${accent || "text-white"}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      {variacao !== undefined && (
        <div className="mt-1.5">
          <VariacaoBadge valor={variacao} label={variacaoLabel} />
        </div>
      )}
    </div>
  );
}

// Selo de variação percentual: verde subiu, vermelho caiu, cinza estável/sem base.
export function VariacaoBadge({ valor, label }) {
  if (valor == null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
        <Minus className="h-3 w-3" /> sem base de comparação
      </span>
    );
  }
  const subiu = valor > 0.05;
  const caiu = valor < -0.05;
  const Icon = subiu ? ArrowUpRight : caiu ? ArrowDownRight : Minus;
  const cls = subiu ? "text-emerald-300" : caiu ? "text-rose-300" : "text-slate-400";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {valor > 0 ? "+" : ""}
      {valor.toFixed(1)}%{label ? ` ${label}` : ""}
    </span>
  );
}

// Cabeçalho de seção numerada — dá a estrutura "relatório" à página.
export function Secao({ numero, titulo, descricao, children }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#111113] p-4 space-y-3 break-inside-avoid">
      <div>
        <h2 className="text-sm font-semibold text-white">
          <span className="text-[#E05252] font-heading mr-1.5">{numero}.</span>
          {titulo}
        </h2>
        {descricao && <p className="text-xs text-slate-500 mt-0.5">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

// Barra horizontal proporcional (ranking, serviços, barbeiros).
export function BarraH({ label, valor, max, valorTexto, cor = "from-[#7a1414] to-[#A81C1C]", sub }) {
  const pct = max > 0 ? Math.min((valor / max) * 100, 100) : 0;
  return (
    <div className="break-inside-avoid">
      <div className="flex items-center justify-between text-xs mb-1 gap-2">
        <span className="text-slate-200 font-medium truncate">{label}</span>
        <span className="text-slate-300 whitespace-nowrap">{valorTexto}</span>
      </div>
      <div className="h-2.5 rounded bg-white/5 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${cor}`} style={{ width: `${pct}%` }} />
      </div>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// Gráfico de colunas simples (evolução mensal). Compatível com impressão.
export function Colunas({ dados, chaveValor, chaveLabel, chaveNome, cor = "bg-[#A81C1C]", formatar }) {
  const max = Math.max(...dados.map((d) => d[chaveValor]), 1);
  return (
    <div className="flex items-end gap-2 h-40 overflow-x-auto pb-1">
      {dados.map((d) => (
        <div key={d.mes} className="flex flex-col items-center gap-1 shrink-0 w-12" title={`${d[chaveNome]}: ${formatar ? formatar(d[chaveValor]) : d[chaveValor]}`}>
          <span className="text-[9px] text-slate-400 whitespace-nowrap">
            {formatar ? formatar(d[chaveValor]) : d[chaveValor]}
          </span>
          <div className="w-7 flex items-end" style={{ height: "96px" }}>
            <div
              className={`w-full rounded-t ${cor}`}
              style={{ height: `${Math.max((d[chaveValor] / max) * 100, d[chaveValor] ? 4 : 0)}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-500 whitespace-nowrap">{d[chaveLabel]}</span>
        </div>
      ))}
    </div>
  );
}

// Linha de funil: etapa, valor e queda percentual em relação à anterior.
export function ItemFunil({ etapa, valor, total, taxaAnterior }) {
  const pct = total > 0 ? (valor / total) * 100 : 0;
  return (
    <div className="space-y-1 break-inside-avoid">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-200 font-medium">{etapa}</span>
        <span className="text-slate-300">
          <strong className="text-white">{valor}</strong>
          {taxaAnterior != null && <span className="text-slate-500"> · {taxaAnterior.toFixed(1)}% da etapa anterior</span>}
        </span>
      </div>
      <div className="h-3 rounded bg-white/5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#7a1414] to-[#E05252]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Tabela enxuta com cabeçalho, usada nos rankings e no detalhamento.
export function Tabela({ colunas, linhas, vazio = "Sem dados no período." }) {
  if (!linhas || linhas.length === 0) {
    return <p className="text-xs text-slate-500 py-3">{vazio}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-slate-500">
          <tr className="text-left border-b border-white/10">
            {colunas.map((c) => (
              <th key={c} className={`py-2 pr-4 font-medium ${/direita|R\$|%/.test(c) ? "text-right" : ""}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {linhas.map((l, i) => (
            <tr key={i} className="hover:bg-white/[0.02]">
              {l.map((cel, j) => (
                <td key={j} className={`py-2 pr-4 ${typeof cel === "object" && cel?.align === "right" ? "text-right" : ""} ${
                  typeof cel === "object" ? cel.cls || "text-slate-300" : "text-slate-300"
                }`}>
                  {typeof cel === "object" ? cel.text : cel}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Texto monetário compacto para gráficos ("R$ 1,2k").
export function brlCurto(v) {
  if (!v) return "R$ 0";
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k`;
  return `R$ ${Math.round(v)}`;
}
