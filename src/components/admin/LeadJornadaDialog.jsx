import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { formatSpDate } from "@/lib/leadsPanel";
import { canalLabel, destinoLabel } from "@/lib/metricasPanel";
import { actionLabel } from "@/lib/metricsCompute";

const dotColor = (t) =>
  t === "visita" ? "bg-sky-400" : t === "clique" ? "bg-[#E05252]" : "bg-amber-400";

// Mostra o caminho percorrido pelo lead (visitas e cliques na landing page)
// vinculado pelo sessao_id gravado no momento da captura.
export default function LeadJornadaDialog({ lead, open, onClose }) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !lead?.sessao_id) {
      setEventos([]);
      return;
    }
    setLoading(true);
    base44.entities.AnalyticsEvent.filter(
      { sessao_id: lead.sessao_id },
      { sort: "created_date", limit: 200 }
    )
      .then((p) => setEventos(p.items || []))
      .catch(() => setEventos([]))
      .finally(() => setLoading(false));
  }, [open, lead?.sessao_id]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111113] border-white/10 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle>Caminho do lead — {lead?.nome || ""}</DialogTitle>
        </DialogHeader>
        {!lead?.sessao_id ? (
          <p className="text-sm text-slate-400">
            Este lead não tem sessão de navegação vinculada (capturado antes do rastreamento ou via chat sem sessão).
          </p>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-4 border-white/20 border-t-[#E05252] rounded-full animate-spin" />
          </div>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum evento de navegação encontrado para esta sessão.</p>
        ) : (
          <ol className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {eventos.map((e, i) => (
              <li key={e.id || i} className="flex items-start gap-3 text-sm">
                <span className="text-slate-500 whitespace-nowrap w-32 shrink-0">{formatSpDate(e.created_date)}</span>
                <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${dotColor(e.tipo_evento)}`} />
                <span className="text-slate-200">
                  <span className="font-medium text-white">{actionLabel(e.tipo_evento)}</span>
                  {e.tipo_evento === "clique" && e.destino ? ` → ${destinoLabel(e.destino)}` : ""}
                  {e.canal ? <span className="text-slate-500"> · {canalLabel(e.canal)}</span> : ""}
                  {e.utm_campaign ? <span className="text-slate-500"> · {e.utm_campaign}</span> : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}