const KPI_CARDS = [
  { key: "total", label: "Total de contatos", cls: "text-white" },
  { key: "cliente_novo", label: "Clientes novos", cls: "text-blue-300" },
  { key: "ja_cliente", label: "Já são clientes", cls: "text-emerald-300" },
  { key: "nao_identificado", label: "Não identificados", cls: "text-slate-300" },
  { key: "agendou", label: "Agendaram", cls: "text-emerald-300" },
  { key: "compareceu", label: "Compareceram", cls: "text-green-300" },
  { key: "nao_convertido", label: "Não convertidos", cls: "text-red-300" },
];

export default function LeadsKPIs({ kpi }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {KPI_CARDS.map((c) => (
        <div key={c.key} className="rounded-lg border border-white/10 bg-[#111113] p-4">
          <p className="font-mono text-[10px] tracking-[0.2em] text-slate-400 uppercase">{c.label}</p>
          <p className={`mt-1 font-heading text-3xl tracking-wide ${c.cls}`}>{kpi[c.key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}