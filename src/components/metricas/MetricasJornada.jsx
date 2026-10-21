import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatSpDate } from "@/lib/leadsPanel";
import { canalLabel, deviceLabel, destinoLabel } from "@/lib/metricasPanel";
import { actionLabel, shortSessao } from "@/lib/metricsCompute";

const resultadoBadge = (r) => {
  if (r.startsWith("Agendamento")) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (r === "WhatsApp") return "bg-green-500/15 text-green-300 border-green-500/30";
  if (r.startsWith("Conversou") || r.startsWith("Abriu")) return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
};

const dotColor = (tipo) =>
  tipo === "visita"
    ? "bg-sky-400"
    : tipo === "clique"
      ? "bg-[#E05252]"
      : tipo === "secao_vista"
        ? "bg-purple-400"
        : tipo === "scroll_profundidade"
          ? "bg-teal-400"
          : "bg-amber-400";

export default function MetricasJornada({ journey, onSelectCanal }) {
  const [open, setOpen] = useState({});
  const toggle = (sid) => setOpen((o) => ({ ...o, [sid]: !o[sid] }));

  if (!journey || journey.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#111113] p-10 text-center">
        <p className="text-slate-400">Nenhuma visita registrada neste período.</p>
        <p className="text-slate-600 text-sm mt-1">A jornada aparece assim que a landing page receber visitas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#111113] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-sm font-semibold text-white">Jornada dos visitantes</p>
        <p className="text-xs text-slate-500 mt-0.5">Clique em uma linha para ver a linha do tempo da visita. Clique na origem para filtrar.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-slate-400 text-left">
            <tr>
              <th className="px-3 py-2.5 font-medium w-8"></th>
              <th className="px-3 py-2.5 font-medium whitespace-nowrap">Data/hora (SP)</th>
              <th className="px-3 py-2.5 font-medium">Sessão</th>
              <th className="px-3 py-2.5 font-medium">Origem / Canal</th>
              <th className="px-3 py-2.5 font-medium">Campanha</th>
              <th className="px-3 py-2.5 font-medium">Dispositivo</th>
              <th className="px-3 py-2.5 font-medium">Interações</th>
              <th className="px-3 py-2.5 font-medium whitespace-nowrap">Última ação</th>
              <th className="px-3 py-2.5 font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {journey.map((row) => {
              const isOpen = open[row.sessao_id];
              const ua = row.ultima_acao;
              return (
                <Fragment key={row.sessao_id}>
                  <tr className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-3 py-2">
                      <button onClick={() => toggle(row.sessao_id)} className="text-slate-400 hover:text-white" aria-label="Expandir linha do tempo">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{formatSpDate(row.data)}</td>
                    <td className="px-3 py-2 text-slate-400 font-mono text-xs">#{shortSessao(row.sessao_id)}</td>
                    <td className="px-3 py-2">
                      {row.canal ? (
                        <button
                          onClick={() => onSelectCanal?.(row.canal)}
                          className="text-left text-slate-300 hover:text-[#E05252] hover:underline"
                        >
                          {canalLabel(row.canal)}
                        </button>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{row.utm_campaign || "—"}</td>
                    <td className="px-3 py-2 text-slate-400">{deviceLabel(row.device)}</td>
                    <td className="px-3 py-2 text-slate-300">{row.interacoes}</td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                      {actionLabel(ua.tipo_evento)}
                      {ua.tipo_evento === "clique" && ua.destino ? ` · ${destinoLabel(ua.destino)}` : ""}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded border whitespace-nowrap ${resultadoBadge(row.resultado)}`}>
                        {row.resultado}
                      </span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-white/5 bg-black/30">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="space-y-2">
                          {row.timeline.map((e, i) => (
                            <div key={e.id || i} className="flex items-start gap-3 text-xs">
                              <span className="text-slate-500 whitespace-nowrap w-28 shrink-0">{formatSpDate(e.created_date)}</span>
                              <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${dotColor(e.tipo_evento)}`} />
                              <span className="text-slate-300">
                                <span className="font-medium text-white">{actionLabel(e.tipo_evento)}</span>
                                {e.tipo_evento === "clique" && e.destino ? ` → ${destinoLabel(e.destino)}` : ""}
                                {e.destino && e.tipo_evento !== "clique" && e.destino !== "chat" ? ` → ${destinoLabel(e.destino)}` : ""}
                                {e.origem_botao ? <span className="text-slate-500"> ({e.origem_botao})</span> : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}