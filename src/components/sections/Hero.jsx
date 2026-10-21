import { Calendar, ChevronDown, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import { Image } from "@/components/ui/image";
import { trackCta } from "@/lib/analytics";
import { abrirAgendarModal } from "@/lib/agendar";

export default function Hero() {
  return (
    <section id="top" className="relative min-h-[92svh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={SITE.images.hero}
          alt="Bancada com tesouras e máquinas profissionais da Barbearia do Neyzito"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/55 via-[#0A0A0B]/25 to-[#0A0A0B]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,11,0.55)_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-24 pb-14 md:pt-28 text-center">
        <Image
          src={SITE.images.logo}
          alt="Logo da Barbearia do Neyzito"
          className="mx-auto h-24 w-24 md:h-32 md:w-32 rounded-full ring-2 ring-white/25 shadow-2xl shadow-black/60 object-cover"
        />
        <p className="mt-7 font-mono text-[11px] md:text-xs tracking-[0.3em] text-slate-300">
          SÃO PAULO · VILA NOVA CONCEIÇÃO · {SITE.since}
        </p>
        <h1 className="mt-4 font-heading text-5xl md:text-7xl lg:text-8xl tracking-wide text-white leading-[0.95]">
          BARBEARIA DO NEYZITO
        </h1>
        <div className="mx-auto mt-5 h-px w-24 bg-[#A81C1C]" />
        <p className="mt-5 mx-auto max-w-2xl text-base md:text-lg text-slate-200 leading-relaxed">
          Barbearia profissional na Vila Nova Conceição, São Paulo. Corte masculino, barba e
          hidratação com estilo, precisão e atendimento de qualidade.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={SITE.appBarberUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { trackCta("appbarber", "hero"); abrirAgendarModal("hero"); }}
            className="inline-flex items-center justify-center gap-2 bg-[#A81C1C] hover:bg-[#C22424] text-white font-bold tracking-wide px-8 py-4 text-lg rounded-md transition-colors"
          >
            <Calendar className="h-5 w-5" /> AGENDAR AGORA
          </a>
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCta("whatsapp", "hero")}
            className="inline-flex items-center justify-center gap-2 border border-[#25D366]/70 hover:border-[#25D366] hover:bg-[#25D366]/10 text-[#25D366] font-bold tracking-wide px-8 py-4 text-lg rounded-md transition-colors"
          >
            <MessageCircle className="h-5 w-5" /> FALAR NO WHATSAPP
          </a>
        </div>

        <p className="mt-5 font-mono text-[10px] md:text-[11px] tracking-[0.15em] text-slate-400">
          VEJA OS HORÁRIOS DISPONÍVEIS · ESCOLHA O PROFISSIONAL E OS VALORES
        </p>

        <a
          href="#servicos"
          aria-label="Rolar para a próxima seção"
          className="mt-10 inline-flex flex-col items-center text-slate-400 hover:text-white transition-colors"
        >
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </div>
    </section>
  );
}