import { useState } from "react";
import { Copy, Check, Link2, MapPin } from "lucide-react";
import { TRACKABLE_LINKS } from "@/lib/trackableLinks";

// Seção "Links rastreáveis" do painel Origem: mostra cada link pronto, com o
// lugar exato onde colar (ficha do Google, bio do Instagram etc.) e um botão
// de copiar. Evita o Neyzito ter que montar as UTMs na mão.
export default function MetricasTrackableLinks() {
  const [copied, setCopied] = useState("");
  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };
  return (
    <div className="rounded-lg border border-white/10 bg-[#111113] p-4">
      <div className="flex items-center gap-2 mb-1">
        <Link2 className="h-4 w-4 text-[#E05252]" />
        <p className="text-sm font-semibold text-white">Links rastreáveis — cole nas suas redes</p>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Copie o link da rede e cole onde indicado. Depois disso, as visitas e leads dessa rede aparecem
        separados no painel acima (em vez de caírem em "Acesso direto").
      </p>
      <div className="space-y-4">
        {TRACKABLE_LINKS.map((g) => (
          <div key={g.grupo}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">
              {g.grupo}
            </p>
            {g.onde && (
              <p className="text-[11px] text-slate-500 mb-2 inline-flex items-start gap-1">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-[#E05252]" />
                <span>Onde colar: {g.onde}</span>
              </p>
            )}
            <div className="space-y-2">
              {g.items.map((it) => (
                <div key={it.label} className="rounded-md border border-white/10 bg-[#0A0A0B] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-200">{it.label}</span>
                    <button
                      onClick={() => copy(it.url)}
                      className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1 shrink-0 border border-white/10 px-2 py-1 rounded"
                    >
                      {copied === it.url ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 break-all font-mono">{it.url}</p>
                  <p className="mt-1 text-[11px] text-slate-600">{it.hint}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-slate-500">
        Dica: depois de colar um link, clique nele você mesmo uma vez — o painel deve registrar 1 visita
        com a origem certa. Se aparecer, está funcionando.
      </p>
    </div>
  );
}
