import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { formatSpDate, formatDateOnly, whatsappLink, situacaoLabel, situacaoBadge } from "@/lib/leadsPanel";

const brl = (v) => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Field = ({ label, children }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm text-white">{children || "—"}</p>
  </div>
);

// Detalhes do lead vinculado a um evento de navegação (mesma sessao_id).
// Aberto a partir da tabela de Eventos Recentes do Painel de Métricas.
export default function EventoLeadDialog({ lead, preco, open, onClose }) {
  if (!lead) return null;
  const wa = whatsappLink(lead.whatsapp);
  const valor = lead.preco_servico != null ? lead.preco_servico : preco;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111113] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Lead vinculado — {lead.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome">{lead.nome}</Field>
            <Field label="Telefone / WhatsApp">{lead.whatsapp}</Field>
            <Field label="E-mail">{lead.email}</Field>
            <Field label="Serviço">{lead.servico_interesse}</Field>
            <Field label="Barbeiro">{lead.barbeiro_preferido}</Field>
            <Field label="Valor do serviço">{valor != null ? brl(valor) : "—"}</Field>
            <Field label="Data do agendamento">
              {lead.data_agendamento ? formatDateOnly(lead.data_agendamento) : "—"}
            </Field>
            <Field label="Capturado em">{formatSpDate(lead.created_date)}</Field>
            <Field label="Situação">
              {lead.situacao_atendimento ? (
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${situacaoBadge(lead.situacao_atendimento)}`}>
                  {situacaoLabel(lead.situacao_atendimento)}
                </span>
              ) : (
                "Pendente"
              )}
            </Field>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            O “valor do serviço” é o preço cadastrado no agendamento; a confirmação de pagamento fica no AppBarber.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1FB45A] text-white text-sm font-semibold px-4 py-2.5 rounded-md"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            <Link
              to="/painel-agenda"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-white/40 text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-md"
            >
              <Shield className="h-4 w-4" /> Ver na Agenda &amp; Clientes
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}