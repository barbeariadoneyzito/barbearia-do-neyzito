import { useState } from "react";
import { formatSpDate } from "@/lib/leadsPanel";
import { destinoLabel, deviceLabel } from "@/lib/metricasPanel";
import { actionLabel } from "@/lib/metricsCompute";
import EventoLeadDialog from "@/components/metricas/EventoLeadDialog";

const tipoColor = (t) =>
  t === "visita" ? "text-sky-300" : t === "clique" ? "text-[#E05252]" : "text-amber-300";

export default function MetricasEventosTable({ eventos, loading, hasMore, onLoadMore, leadsBySessao = {}, precoMap = {} }) {
  const [sel, setSel] = useState(null);

  return (
    <div className="rounded-lg border border-white/10 bg-[#111113] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-slate-400 text-left">
            <tr>
              <th className="px-3 py-2.5 font-medium">Data/hora (SP)</th>
              <th className="px-3 py-2.5 font-medium">Tipo</th>
              <th className="px-3 py-2.5 font-medium">Destino</th>
              <th className="px-3 py-2.5 font-medium">Origem</th>
              <th className="px-3 py-2.5 font-medium">Lead vinculado</th>
              <th className="px-3 py-2.5 font-medium">Dispositivo</th>
              <th className="px-3 py-2.5 font-medium">UTM</th>
            </tr>
          </thead>
          <tbody>
            {loading && eventos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">Carregando…</td>
              </tr>
            ) : eventos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">Nenhum evento neste período.</td>
              </tr>
            ) : (
              eventos.map((e) => {
                const lead = leadsBySessao[e.sessao_id];
                const convertido = lead && e.tipo_evento === "clique" && e.destino === "appbarber";
                return (
                  <tr key={e.id} className="border-t border-white/5">
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{formatSpDate(e.created_date)}</td>
                    <td className="px-3 py-2">
                      <span className={tipoColor(e.tipo_evento)}>{actionLabel(e.tipo_evento)}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-300">{e.destino ? destinoLabel(e.destino) : "—"}</td>
                    <td className="px-3 py-2 text-slate-400">{e.origem_botao || "—"}</td>
                    <td className="px-3 py-2">
                      {lead ? (
                        <button
                          onClick={() => setSel(lead)}
                          className="inline-flex items-center gap-1.5 text-left"
                          title="Ver dados do lead"
                        >
                          <span className="text-white font-medium hover:underline">{lead.nome}</span>
                          <span
                            className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] ${
                              convertido
                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                                : "border-sky-500/40 bg-sky-500/15 text-sky-300"
                            }`}
                          >
                            {convertido ? "Convertido" : "Lead"}
                          </span>
                        </button>
                      ) : (
                        <span className="text-slate-500">Anônimo</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{deviceLabel(e.dispositivo)}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">
                      {[e.utm_source, e.utm_medium, e.utm_campaign].filter(Boolean).join(" / ") || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="p-3 text-center">
          <button onClick={onLoadMore} className="text-sm text-[#E05252] hover:underline">
            Carregar mais
          </button>
        </div>
      )}
      <EventoLeadDialog
        lead={sel}
        preco={sel ? precoMap[sel.servico_interesse] : null}
        open={!!sel}
        onClose={() => setSel(null)}
      />
    </div>
  );
}