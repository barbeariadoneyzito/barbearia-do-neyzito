import { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Calendar, FileBarChart, Menu, Shield, X } from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import { Image } from "@/components/ui/image";
import { useAuth } from "@/lib/AuthContext";
import { trackCta } from "@/lib/analytics";
import { abrirAgendarModal } from "@/lib/agendar";

const NAV_LINKS = [
  { label: "Serviços", href: "#servicos" },
  { label: "Galeria", href: "#galeria" },
  { label: "Avaliações", href: "#avaliacoes" },
  { label: "Contato", href: "#contato" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0A0A0B]/90 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 h-16 md:h-20">
        <a href="#top" className="flex items-center gap-3 min-w-0">
          <Image
            src={SITE.images.logo}
            alt="Logo Barbearia do Neyzito"
            className="h-9 w-9 md:h-11 md:w-11 rounded-full object-cover shrink-0"
          />
          <span className="font-heading text-lg md:text-2xl tracking-wider text-white truncate">
            BARBEARIA DO NEYZITO
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/painel-origem"
                className="inline-flex items-center gap-2 border border-white/15 hover:border-white/40 text-slate-200 hover:text-white text-xs font-medium px-3 py-2 rounded-md transition-colors"
                title="Painel de Origem dos Leads — acesso restrito"
              >
                <BarChart3 className="h-4 w-4" /> Origem
              </Link>
              <Link
                to="/painel-agenda"
                className="inline-flex items-center gap-2 border border-white/15 hover:border-white/40 text-slate-200 hover:text-white text-xs font-medium px-3 py-2 rounded-md transition-colors"
                title="Agenda & Clientes — acesso restrito"
              >
                <Shield className="h-4 w-4" /> Agenda
              </Link>
              <Link
                to="/painel-relatorio"
                className="inline-flex items-center gap-2 border border-white/15 hover:border-white/40 text-slate-200 hover:text-white text-xs font-medium px-3 py-2 rounded-md transition-colors"
                title="Relatório Mensal — acesso restrito"
              >
                <FileBarChart className="h-4 w-4" /> Relatório
              </Link>
            </div>
          )}
          <a
            href={SITE.appBarberUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { trackCta("appbarber", "navbar"); abrirAgendarModal("navbar"); }}
            className="hidden sm:inline-flex items-center gap-2 bg-[#A81C1C] hover:bg-[#C22424] text-white font-semibold text-sm px-5 py-2.5 rounded-md transition-colors"
          >
            <Calendar className="h-4 w-4" /> AGENDAR AGORA
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-white p-2"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-white/10 px-4 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-slate-200 py-1"
            >
              {l.label}
            </a>
          ))}
          {isAdmin && (
            <div className="flex flex-col gap-2 py-1">
              <Link
                to="/painel-origem"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 text-slate-200"
              >
                <BarChart3 className="h-4 w-4" /> Origem dos Leads
              </Link>
              <Link
                to="/painel-agenda"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 text-slate-200"
              >
                <Shield className="h-4 w-4" /> Agenda &amp; Clientes
              </Link>
              <Link
                to="/painel-relatorio"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 text-slate-200"
              >
                <FileBarChart className="h-4 w-4" /> Relatório Mensal
              </Link>
            </div>
          )}
          <a
            href={SITE.appBarberUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { trackCta("appbarber", "navbar"); abrirAgendarModal("navbar"); }}
            className="sm:hidden inline-flex items-center justify-center gap-2 bg-[#A81C1C] text-white font-semibold px-5 py-3 rounded-md"
          >
            <Calendar className="h-4 w-4" /> AGENDAR AGORA
          </a>
        </nav>
      )}
    </header>
  );
}