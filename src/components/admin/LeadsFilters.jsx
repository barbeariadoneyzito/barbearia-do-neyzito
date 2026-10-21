import { Search } from "lucide-react";
import { STATUS_OPTIONS, TIPO_CLIENTE_OPTIONS, ORIGEM_OPTIONS } from "@/lib/leadsPanel";

const selectCls =
  "w-full rounded-lg border border-white/10 bg-[#111113] px-3 py-2.5 text-sm text-white focus:border-[#A81C1C] focus:outline-none";

export default function LeadsFilters({ filters, setFilters, options }) {
  const set = (k, v) => setFilters((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Buscar por nome, WhatsApp ou e-mail..."
          className="w-full rounded-lg border border-white/10 bg-[#111113] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#A81C1C] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        <select value={filters.tipoCliente} onChange={(e) => set("tipoCliente", e.target.value)} className={selectCls}>
          <option value="all">Todos os tipos</option>
          {TIPO_CLIENTE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select value={filters.status} onChange={(e) => set("status", e.target.value)} className={selectCls}>
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select value={filters.origem} onChange={(e) => set("origem", e.target.value)} className={selectCls}>
          <option value="all">Todas as origens</option>
          {ORIGEM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select value={filters.campanha} onChange={(e) => set("campanha", e.target.value)} className={selectCls}>
          <option value="all">Todas as campanhas</option>
          {options.campanhas.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={filters.servico} onChange={(e) => set("servico", e.target.value)} className={selectCls}>
          <option value="all">Todos os serviços</option>
          {options.servicos.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={filters.barbeiro} onChange={(e) => set("barbeiro", e.target.value)} className={selectCls}>
          <option value="all">Todos os barbeiros</option>
          {options.barbeiros.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
            className={selectCls}
            aria-label="Data inicial"
          />
        </div>
        <div>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
            className={selectCls}
            aria-label="Data final"
          />
        </div>
      </div>
    </div>
  );
}