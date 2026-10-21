import { Calendar, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import { trackCta } from "@/lib/analytics";
import { abrirAgendarModal } from "@/lib/agendar";

export default function FloatingActions() {
  return (
    <>
      {/* Botão flutuante de WhatsApp — desktop */}
      <a
        href={SITE.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        onClick={() => trackCta("whatsapp", "floating")}
        className="hidden md:flex fixed bottom-6 right-6 z-50 h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/50 hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
      {/* Barra fixa de ações — mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 grid grid-cols-2 border-t border-white/10 bg-[#0A0A0B]/95 backdrop-blur">
        <a
          href={SITE.appBarberUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { trackCta("appbarber", "floating"); abrirAgendarModal("floating"); }}
          className="flex items-center justify-center gap-2 py-3.5 bg-[#A81C1C] text-white font-semibold text-sm"
        >
          <Calendar className="h-4 w-4" /> AGENDAR AGORA
        </a>
        <a
          href={SITE.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackCta("whatsapp", "floating")}
          className="flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white font-semibold text-sm"
        >
          <MessageCircle className="h-4 w-4" /> WHATSAPP
        </a>
      </div>
    </>
  );
}