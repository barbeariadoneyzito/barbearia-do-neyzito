import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, X, ExternalLink } from "lucide-react";
import { formatSpDate, whatsappLink } from "@/lib/leadsPanel";

export default function LeadsNotifications({ unviewed, onMarkViewed, onMarkAllViewed }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const count = unviewed.length;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#111113] px-3 py-2 text-sm text-slate-200 hover:border-[#A81C1C]/60 hover:text-white transition-colors"
        title="Notificações de novos leads"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#E05252] animate-pulse" />
            <span className="font-semibold text-white">{count}</span>
            <span className="text-xs text-slate-400">{count === 1 ? "novo lead" : "novos leads"}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] rounded-lg border border-white/10 bg-[#111113] shadow-2xl z-30">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-heading tracking-wide text-white">NOTIFICAÇÕES</p>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {count === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Nenhum novo lead. Todos visualizados.
            </div>
          ) : (
            <>
              <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
                {unviewed.map((l) => {
                  const wa = whatsappLink(l.whatsapp);
                  return (
                    <div
                      key={l.id}
                      onClick={() => onMarkViewed(l.id)}
                      className="cursor-pointer px-4 py-3 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 font-semibold text-white text-sm">
                          <span className="h-2 w-2 rounded-full bg-[#E05252]" />
                          {l.nome || "—"}
                        </span>
                        <span className="text-[11px] text-slate-500 whitespace-nowrap">{formatSpDate(l.created_date)}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[#E05252] hover:underline"
                          >
                            {l.whatsapp} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {l.servico_interesse && <span>Serviço: {l.servico_interesse}</span>}
                        {l.barbeiro_preferido && <span>Barbeiro: {l.barbeiro_preferido}</span>}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600">Clique para marcar como visualizado</p>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-white/10 p-3">
                <button
                  onClick={onMarkAllViewed}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#A81C1C] hover:bg-[#A81C1C]/90 text-white text-sm font-semibold py-2"
                >
                  <CheckCheck className="h-4 w-4" /> Marcar todos como visualizados
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}